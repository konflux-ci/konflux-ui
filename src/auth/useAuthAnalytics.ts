import React from 'react';
import { TrackEvents } from '~/analytics';
import { analyticsService } from '~/analytics/AnalyticsService';
import { useTrackAnalyticsEvent } from '~/analytics/hooks';
import { journeyCollector } from '~/analytics/JourneyCollector';
import { logger } from '~/monitoring/logger';

export const useAuthAnalytics = () => {
  const trackEvent = useTrackAnalyticsEvent();

  const onLogin = React.useCallback(() => {
    trackEvent(TrackEvents.user_login_event, {});
    logger.info('User Logged In');
  }, [trackEvent]);

  const onLogout = React.useCallback(() => {
    trackEvent(TrackEvents.user_logout_event, {});
    // Logout is a session boundary; flush before reset even after a recent checkpoint.
    journeyCollector.flush({ force: true });
    journeyCollector.reset();
    analyticsService.reset();
    logger.info('User Logged Out');
  }, [trackEvent]);

  return { onLogin, onLogout };
};
