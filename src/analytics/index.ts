import { logger } from '~/monitoring/logger';
import { setAnalytics } from './analytics-client';
import { analyticsService } from './AnalyticsService';
import { loadAnalyticsConfig } from './load-config';

// Deferred promise that resolves to true/false once init settles.
// Condition resolvers await this instead of polling a boolean flag.
let resolveReady: (value: boolean) => void;
const analyticsReady: Promise<boolean> = new Promise((r) => {
  resolveReady = r;
});

/**
 * Converts a configured Segment API URL into the host-and-path form expected
 * by the Segment SDK. Segment's default is `api.segment.io/v1`; dropping the
 * path sends events to `/t` instead of `/v1/t`.
 */
function normalizeApiHost(apiUrl: string): string {
  const url = new URL(/^https?:\/\//i.test(apiUrl) ? apiUrl : `https://${apiUrl}`);
  return `${url.host}${url.pathname.replace(/\/+$/, '')}`;
}

/**
 * Returns the initialized Segment analytics instance, or undefined if analytics
 * is disabled or not yet initialized. Callers must handle the undefined case.
 */
export { getAnalytics } from './analytics-client';

/**
 * Returns a promise that resolves to true if analytics was successfully
 * initialized, or false if it was disabled / failed. Safe to call at any time —
 * callers that run before init completes will simply wait.
 */
export function whenAnalyticsReady(): Promise<boolean> {
  return analyticsReady;
}

/**
 * Initializes the Segment SDK when ANALYTICS_ENABLED is true and a valid write
 * key is present. Uses dynamic import so the SDK is not in the main bundle when
 * disabled. Errors are logged and reported to Sentry if available.
 */
export async function initAnalytics(): Promise<void> {
  try {
    const config = await loadAnalyticsConfig();

    const writeKey = config.writeKey?.trim();
    const apiUrl = config.apiUrl?.trim();
    if (!config.enabled || !writeKey || !apiUrl) {
      resolveReady(false);
      return;
    }
    const apiHost = normalizeApiHost(apiUrl);

    const { AnalyticsBrowser } = await import(
      '@segment/analytics-next' /* webpackChunkName: "segment-analytics" */
    );

    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey,
      },
      {
        disableClientPersistence: true,
        integrations: {
          'Segment.io': {
            apiHost,
            protocol: 'https',
          },
        },
      },
    );

    setAnalytics(analytics);
    void analytics.setAnonymousId(analyticsService.getCommonProperties().sessionId);
    const userId = analyticsService.getUserId();
    if (userId) {
      void analytics.identify(userId);
    }
    resolveReady(true);
    logger.info('Analytics loaded');
  } catch (error) {
    resolveReady(false);
    logger.error(
      'Error loading Analytics',
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

export * from './gen/analytics-types';
export { useTrackAnalyticsEvent } from './hooks';
