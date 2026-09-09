// Sentry must be initialized before any other imports that trigger createBrowserRouter.
// This side-effect import calls initMonitoring() synchronously.
import './instrument';

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import ReactDOM from 'react-dom/client';
import { initAnalytics, TrackEvents } from '~/analytics';
import { analyticsService, consumeLoginSignal } from '~/analytics/AnalyticsService';
import {
  captureArrivalSourceOnce,
  getArrivalSource,
  hasSessionStarted,
  markSessionStartedOnce,
} from '~/analytics/arrival-source';
import { obfuscate } from '~/analytics/obfuscate';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { logger } from '~/monitoring/logger';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import { useAuthAnalytics } from './auth/useAuthAnalytics';
import { forceEnableFlagsOnce } from './feature-flags/forceEnableFlagsOnce';
import { FeatureFlagsStore } from './feature-flags/store';
import { getAllConditionsKeysFromFlags } from './feature-flags/utils';
import { queryClient } from './k8s/query/core';
import { REGISTRATIONS_LOADED } from './registers';
import { router } from './routes';
import { ThemeProvider } from './shared/theme/ThemeContext';

import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/react-styles/css/utilities/Spacing/spacing.css';
import './main.scss';

// Must run before AuthProvider can mount and trigger the OAuth redirect,
// otherwise document.referrer is overwritten before we can read it.
// See src/analytics/arrival-source.ts for details.
captureArrivalSourceOnce();

// TEMP: Force-enable selected flags once per release/build
forceEnableFlagsOnce(['kubearchive-logs', 'taskruns-kubearchive', 'pipelineruns-kubearchive'], {
  releaseId: '2025-11-17',
});

export const App = () => {
  const [publicInfo, loaded, error] = useKonfluxPublicInfo();
  const { onLogin } = useAuthAnalytics();
  const { isAuthenticated, user } = useAuth();

  React.useEffect(() => {
    if (!loaded || error || !publicInfo) {
      return;
    }

    void (async () => {
      analyticsService.setCommonProperties({
        // konflux-public-info does not emit clusterVersion; use the best available
        // cluster-type version so CommonFields are populated on all environments.
        clusterVersion:
          publicInfo.clusterVersion ?? publicInfo.openshiftVersion ?? publicInfo.kubernetesVersion,
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

  React.useEffect(() => {
    // webpack side effects to prevent tree-shaking
    if (REGISTRATIONS_LOADED) {
      void FeatureFlagsStore.ensureConditions(getAllConditionsKeysFromFlags());
    }
  }, []);

  return (
    <>
      <NuqsAdapter>
        <RouterProvider
          router={router}
          fallbackElement={
            <Bullseye>
              <Spinner />
            </Bullseye>
          }
        />
      </NuqsAdapter>
      <ReactQueryDevtools initialIsOpen={false} position="bottom" buttonPosition="bottom-left" />
    </>
  );
};

void (() => {
  void initAnalytics().catch((reason) => {
    logger.error(
      'Failed to initialize analytics',
      reason instanceof Error ? reason : new Error(String(reason)),
    );
  });

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
})();
