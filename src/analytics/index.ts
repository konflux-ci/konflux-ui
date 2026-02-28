import type { Analytics } from '@segment/analytics-next';
import { loadAnalyticsConfig } from './load-config';

let analyticsInstance: Analytics | undefined;

/**
 * Returns the initialized Segment analytics instance, or undefined if analytics
 * is disabled or not yet initialized. Callers must handle the undefined case.
 */
export function getAnalytics(): Analytics | undefined {
  return analyticsInstance;
}

/**
 * Initializes the Segment SDK when ANALYTICS_ENABLED is true and a valid write
 * key is present. Uses dynamic import so the SDK is not in the main bundle when
 * disabled. Errors are logged and reported to Sentry if available.
 */
export async function initAnalytics(): Promise<void> {
  const config = loadAnalyticsConfig();

  const writeKey = config.writeKey?.trim();
  const apiHost = config.apiUrl?.trim();
  if (!config.enabled || !writeKey || !apiHost) {
    return;
  }

  try {
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
    // eslint-disable-next-line no-console
    console.info('Analytics loaded');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading Analytics', error);
  }
}
