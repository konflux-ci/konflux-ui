import type { Analytics } from '@segment/analytics-next';
import { loadAnalyticsConfig } from './load-config';

let analyticsInstance: Analytics | undefined;

// Deferred promise that resolves to true/false once init settles.
// Condition resolvers await this instead of polling a boolean flag.
let resolveReady: (value: boolean) => void;
let analyticsReady: Promise<boolean> = new Promise((r) => {
  resolveReady = r;
});

/**
 * Returns the initialized Segment analytics instance, or undefined if analytics
 * is disabled or not yet initialized. Callers must handle the undefined case.
 */
export function getAnalytics(): Analytics | undefined {
  return analyticsInstance;
}

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
    const apiHost = config.apiUrl?.trim();
    if (!config.enabled || !writeKey || !apiHost) {
      resolveReady(false);
      return;
    }

    const { AnalyticsBrowser } = await import(
      '@segment/analytics-next' /* webpackChunkName: "segment-analytics" */
    );

    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey,
      },
      {
        integrations: {
          'Segment.io': {
            apiHost,
            protocol: 'https',
          },
        },
      },
    );

    analyticsInstance = analytics;
    resolveReady(true);
    // eslint-disable-next-line no-console
    console.info('Analytics loaded');
  } catch (error) {
    resolveReady(false);
    // eslint-disable-next-line no-console
    console.error('Error loading Analytics', error);
  }
}
