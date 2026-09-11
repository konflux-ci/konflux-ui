import React from 'react';
import { TrackEvents } from '~/analytics';
import { analyticsService } from '~/analytics/AnalyticsService';
import { useTrackAnalyticsEvent } from '~/analytics/hooks';
import { journeyCollector } from '~/analytics/JourneyCollector';
import { logger } from '~/monitoring/logger';

/**
 * Upper bound on how long `onLogout` will wait for the logout/journey events'
 * Segment SDK dispatch operations before letting the caller proceed to
 * `redirectToLogin()`. This is only a safety net so a stalled network never
 * blocks logout indefinitely.
 */
export const LOGOUT_FLUSH_TIMEOUT_MS = 2000;

const withTimeout = (promise: Promise<unknown>, timeoutMs: number): Promise<void> =>
  Promise.race([
    promise.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);

export const useAuthAnalytics = () => {
  const trackEvent = useTrackAnalyticsEvent();

  const onLogin = React.useCallback(() => {
    trackEvent(TrackEvents.user_login_event, {});
    logger.info('User Logged In');
  }, [trackEvent]);

  const onLogout = React.useCallback(async (): Promise<void> => {
    // Logout is immediately followed by a synchronous redirect to the login
    // page (see AuthContext#signOut / redirectToLogin). Segment's `track()`
    // call is async: if we fire it and navigate away in the same tick, the
    // browser can tear the page down before the request is dispatched. Waiting
    // for the SDK operation (bounded by a short timeout) gives the transport
    // its best opportunity to dispatch before AuthContext navigates away.
    await withTimeout(
      Promise.all([
        analyticsService.trackAndWait(TrackEvents.user_logout_event, {}),
        // Logout is a session boundary; flush before reset even after a recent checkpoint.
        journeyCollector.flushAndWait({ force: true }),
      ]),
      LOGOUT_FLUSH_TIMEOUT_MS,
    );
    journeyCollector.reset();
    analyticsService.reset();
    logger.info('User Logged Out');
  }, []);

  return { onLogin, onLogout };
};
