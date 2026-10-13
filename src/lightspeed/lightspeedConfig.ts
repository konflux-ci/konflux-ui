export const LIGHTSPEED_API_BASE = '/api/plugins/lightspeed';

/** Max wait for a single Lightspeed health-check HTTP request before aborting. */
export const LIGHTSPEED_HEALTH_CHECK_TIMEOUT_MS = 10_000;

/** How long to cache `isLightspeedAvailable` before re-running the health check. */
export const LIGHTSPEED_CONDITION_TTL_MS = 30_000;

export const resolveLightspeedClientBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return LIGHTSPEED_API_BASE;
  }

  // LightspeedClient.buildUrl() uses `new URL(baseUrl)`, which requires an absolute URL.
  return new URL(LIGHTSPEED_API_BASE, window.location.origin).href;
};
