import { parseBoolean, parseNumber } from '~/utils/common-utils';
import type { MonitoringConfig } from './types';

/**
 * Default monitoring configuration (disabled by default)
 */
const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: false,
  provider: 'noop',
  environment: 'development',
  cluster: 'local',
};

/**
 * Load monitoring configuration from window.KONFLUX_RUNTIME
 * Values are injected at runtime via runtime-config.js
 *
 * In local development: defaults from public/runtime-config.js (monitoring disabled)
 * In staging/production: values from ConfigMap via init container
 */
export function loadMonitoringConfig(): MonitoringConfig {
  if (typeof window === 'undefined' || !window.KONFLUX_RUNTIME) {
    return DEFAULT_MONITORING_CONFIG;
  }

  const runtime = window.KONFLUX_RUNTIME;
  const enabled = parseBoolean(runtime.MONITORING_ENABLED, false);

  // If monitoring is disabled, return noop config
  if (!enabled) {
    return {
      ...DEFAULT_MONITORING_CONFIG,
      environment: runtime.MONITORING_ENVIRONMENT || DEFAULT_MONITORING_CONFIG.environment,
      cluster: runtime.MONITORING_CLUSTER || DEFAULT_MONITORING_CONFIG.cluster,
    };
  }

  // Monitoring is enabled, return Sentry config
  return {
    enabled: true,
    provider: 'sentry',
    dsn: runtime.MONITORING_DSN || '',
    environment: runtime.MONITORING_ENVIRONMENT || 'production',
    cluster: runtime.MONITORING_CLUSTER || 'unknown',
    sampleRates: {
      errors: parseNumber(runtime.MONITORING_SAMPLE_RATE_ERRORS, 1.0),
    },
  };
}
