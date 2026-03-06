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

/**
 * Load analytics configuration from window.KONFLUX_RUNTIME
 * Values are injected at runtime via runtime-config.js
 *
 * In local development: defaults from public/runtime-config.js (analytics disabled)
 * In staging/production: values from ConfigMap via init container
 */
export function loadAnalyticsConfig(): AnalyticsConfig {
  if (typeof window === 'undefined' || !window.KONFLUX_RUNTIME) {
    return DEFAULT_ANALYTICS_CONFIG;
  }

  const runtime = window.KONFLUX_RUNTIME;
  const enabled = parseBoolean(runtime.ANALYTICS_ENABLED, false);

  // If analytics is disabled, return noop config
  if (!enabled) {
    return DEFAULT_ANALYTICS_CONFIG;
  }

  // analytics is enabled, return config
  return {
    enabled: true,
    writeKey: runtime.ANALYTICS_WRITE_KEY || '',
    apiUrl: runtime.ANALYTICS_API_URL || '',
  };
}
