import type { Analytics } from '@segment/analytics-next';
import { analyticsService } from './AnalyticsService';
import { journeyCollector } from './JourneyCollector';
import { loadAnalyticsConfig } from './load-config';

/**
 * How long the tab must remain hidden before a checkpoint flush fires.
 * Prevents event spam from routine tab-switching while still capturing
 * abandoned-tab sessions. Logout, beforeunload, and auto-split flushes
 * are unaffected by this delay.
 */
export const HIDDEN_FLUSH_DELAY_MS = 10 * 60 * 1000;

let analyticsInstance: Analytics | undefined;

// Deferred promise that resolves to true/false once init settles.
// Condition resolvers await this instead of polling a boolean flag.
let resolveReady: (value: boolean) => void;
const analyticsReady: Promise<boolean> = new Promise((r) => {
  resolveReady = r;
});

/**
 * Converts a configured Segment API URL into the host form expected by both
 * the Segment SDK and the unload beacon endpoint.
 */
function normalizeApiHost(apiUrl: string): string {
  const url = new URL(/^https?:\/\//i.test(apiUrl) ? apiUrl : `https://${apiUrl}`);
  return url.host;
}

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
    const apiUrl = config.apiUrl?.trim();
    if (!config.enabled || !writeKey || !apiUrl) {
      resolveReady(false);
      return;
    }
    const apiHost = normalizeApiHost(apiUrl);

    let hiddenFlushTimer: ReturnType<typeof setTimeout> | undefined;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        journeyCollector.notifyHidden();
        if (hiddenFlushTimer === undefined) {
          hiddenFlushTimer = setTimeout(() => {
            journeyCollector.flush();
            hiddenFlushTimer = undefined;
          }, HIDDEN_FLUSH_DELAY_MS);
        }
      } else {
        journeyCollector.notifyVisible();
        if (hiddenFlushTimer !== undefined) {
          clearTimeout(hiddenFlushTimer);
          hiddenFlushTimer = undefined;
        }
      }
    });

    window.addEventListener('beforeunload', () => {
      journeyCollector.flushViaBeacon({ writeKey, apiHost });
    });

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

    analyticsInstance = analytics;
    analytics.setAnonymousId(analyticsService.getCommonProperties().sessionId);
    const userId = analyticsService.getUserId();
    if (userId) {
      void analytics.identify(userId);
    }
    resolveReady(true);
    // eslint-disable-next-line no-console
    console.info('Analytics loaded');
  } catch (error) {
    resolveReady(false);
    // eslint-disable-next-line no-console
    console.error('Error loading Analytics', error);
  }
}

export * from './gen/analytics-types';
export { useTrackAnalyticsEvent } from './hooks';
