import type { MonitoringConfig } from './types';

const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: false,
  provider: 'noop',
  environment: 'development',
};

window.KONFLUX_MONITORING = {};

export function loadMonitoringConfig(): MonitoringConfig {
  if (
    typeof window !== 'undefined' &&
    window.KONFLUX_MONITORING &&
    typeof window.KONFLUX_MONITORING === 'object'
  ) {
    if (!window.KONFLUX_MONITORING.enabled) {
      return {
        enabled: window.KONFLUX_MONITORING.enabled ?? true,
        provider: 'sentry',
        dsn: '',
        environment: window.KONFLUX_MONITORING.environment,
        sampleRates: window.KONFLUX_MONITORING.sampleRates,
      };
    }
    return DEFAULT_MONITORING_CONFIG;
  }
  return DEFAULT_MONITORING_CONFIG;
}
