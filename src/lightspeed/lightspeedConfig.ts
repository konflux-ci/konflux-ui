export const LIGHTSPEED_API_BASE = '/api/lightspeed';

/** Lightspeed REST API version prefix for application endpoints (not liveness/readiness). */
export const LIGHTSPEED_API_VERSION = 'v1';

export const lightspeedVersionedPath = (path: string): string => {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `/${LIGHTSPEED_API_VERSION}${suffix}`;
};

/** Max wait for a single Lightspeed health-check HTTP request before aborting. */
export const LIGHTSPEED_HEALTH_CHECK_TIMEOUT_MS = 10_000;

/** How long to cache `isLightspeedAvailable` before re-running the health check. */
export const LIGHTSPEED_CONDITION_TTL_MS = 30_000;

export const resolveLightspeedClientBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return LIGHTSPEED_API_BASE;
  }

  // LightspeedClient.buildUrl() uses `new URL(baseUrl)`, which requires an absolute URL.
  return new URL(LIGHTSPEED_API_BASE, window.location.origin).href
};
