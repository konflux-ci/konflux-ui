import React from 'react';
import { TrackEvents } from '~/analytics';
import { analyticsService } from '~/analytics/AnalyticsService';
import { useTrackAnalyticsEvent } from '~/analytics/hooks';
import { obfuscate } from '~/analytics/obfuscate';
import { logger } from '~/monitoring/logger';
import { UserDataType } from './type';

/**
 * Provides analytics callbacks for auth events.
 * Uses useTrackAnalyticsEvent to send typed events through Segment.
 *
 * @example
 * const { onLogin, onLogout } = useAuthAnalytics();
 * onLogin(user);  // identify + track user_login
 * onLogout(user); // track user_logout + reset
 */
export const useAuthAnalytics = () => {
  const trackEvent = useTrackAnalyticsEvent();

  const onLogin = React.useCallback(
    (user: UserDataType) => {
      if (user.preferredUsername) {
        void obfuscate(user.preferredUsername).then((userId) => {
          analyticsService.identify(userId);
          trackEvent(TrackEvents.user_login_event, { userId });
        });
      }
      logger.info('User Logged In');
    },
    [trackEvent],
  );

  const onLogout = React.useCallback(
    (user: UserDataType) => {
      if (user.preferredUsername) {
        void obfuscate(user.preferredUsername).then((userId) => {
          trackEvent(TrackEvents.user_logout_event, { userId });
          analyticsService.reset();
        });
      } else {
        analyticsService.reset();
      }
      logger.info('User Logged Out');
    },
    [trackEvent],
  );

  return { onLogin, onLogout };
};
