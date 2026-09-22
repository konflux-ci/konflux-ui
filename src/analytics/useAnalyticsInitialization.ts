import { useEffect } from 'react';
import { TrackEvents } from '~/analytics';
import { analyticsService, consumeLoginSignal } from '~/analytics/AnalyticsService';
import {
  getArrivalSource,
  hasSessionStarted,
  markSessionStartedOnce,
} from '~/analytics/arrival-source';
import { obfuscate } from '~/analytics/obfuscate';
import { useAuth } from '~/auth/useAuth';
import { useAuthAnalytics } from '~/auth/useAuthAnalytics';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { logger } from '~/monitoring/logger';

export const useAnalyticsInitialization = () => {
  const [publicInfo, loaded, error] = useKonfluxPublicInfo();
  const { onLogin } = useAuthAnalytics();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!loaded || error || !publicInfo) {
      return;
    }

    void (async () => {
      analyticsService.setCommonProperties({
        ...(publicInfo.clusterVersion ? { clusterVersion: publicInfo.clusterVersion } : {}),
        konfluxVersion: publicInfo.konfluxVersion,
        kubernetesVersion: publicInfo.kubernetesVersion,
        openshiftVersion: publicInfo.openshiftVersion,
      });

      if (isAuthenticated && user.preferredUsername && publicInfo.clusterId) {
        try {
          analyticsService.identify(await obfuscate(user.preferredUsername, publicInfo.clusterId));
        } catch (reason) {
          logger.error(
            'Failed to obfuscate analytics user ID',
            reason instanceof Error ? reason : new Error(String(reason)),
          );
        }
      }

      if (consumeLoginSignal()) {
        onLogin();
      }

      if (!hasSessionStarted()) {
        const arrivalSource = getArrivalSource();
        if (
          analyticsService.track(TrackEvents.ui_session_started_event, { arrivalSource }) &&
          markSessionStartedOnce()
        ) {
          logger.info('UI session started', {
            event: TrackEvents.ui_session_started_event,
            arrivalSource,
          });
        }
      }
    })();
  }, [loaded, error, publicInfo, isAuthenticated, onLogin, user.preferredUsername]);
};
