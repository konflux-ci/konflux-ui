import { parseBoolean } from '~/utils/common-utils';
import { AnalyticsConfig } from './types';

/**
 * Default analytics configuration (disabled by default)
 */
const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: false,
  writeKey: undefined,
  apiUrl: undefined,
};

function isPlainText(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/plain');
}

/**
 * Load analytics configuration from window.KONFLUX_RUNTIME
 * Used as fallback for local development where /segment/* APIs are unavailable.
 */
function loadAnalyticsConfigFromRuntime(): AnalyticsConfig {
  if (typeof window === 'undefined' || !window.KONFLUX_RUNTIME) {
    return DEFAULT_ANALYTICS_CONFIG;
  }

  const runtime = window.KONFLUX_RUNTIME;
  const enabled = parseBoolean(runtime.ANALYTICS_ENABLED, false);

  if (!enabled) {
    return DEFAULT_ANALYTICS_CONFIG;
  }

  return {
    enabled: true,
    writeKey: runtime.ANALYTICS_WRITE_KEY || '',
    apiUrl: runtime.ANALYTICS_API_URL || '',
  };
}

/**
 * Fetch Segment config from backend APIs (/segment/key and /segment/url).
 * Falls back to window.KONFLUX_RUNTIME values for local development.
 */
export async function loadAnalyticsConfig(): Promise<AnalyticsConfig> {
  try {
    const [keyResponse, urlResponse] = await Promise.all([
      fetch('/segment/key'),
      fetch('/segment/url'),
    ]);

    if (keyResponse.ok && urlResponse.ok && isPlainText(keyResponse) && isPlainText(urlResponse)) {
      const writeKey = (await keyResponse.text()).trim();
      const apiUrl = (await urlResponse.text()).trim();

      if (writeKey) {
        return { enabled: true, writeKey, apiUrl };
      }
    }
  } catch {
    // API fetch failed, fall through to runtime config
  }

  return loadAnalyticsConfigFromRuntime();
}
