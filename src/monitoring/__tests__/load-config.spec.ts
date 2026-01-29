import { loadMonitoringConfig } from '../load-config';

describe('loadMonitoringConfig', () => {
  const originalKonfluxRuntime = window.KONFLUX_RUNTIME;

  afterEach(() => {
    window.KONFLUX_RUNTIME = originalKonfluxRuntime;
  });

  it('should return default config when window.KONFLUX_RUNTIME is undefined', () => {
    window.KONFLUX_RUNTIME = undefined;

    const config = loadMonitoringConfig();

    expect(config).toEqual({
      enabled: false,
      provider: 'noop',
      environment: 'development',
      cluster: 'local',
    });
  });

  it('should return noop config with custom environment/cluster when monitoring is disabled', () => {
    window.KONFLUX_RUNTIME = {
      MONITORING_ENABLED: 'false',
      MONITORING_ENVIRONMENT: 'staging',
      MONITORING_CLUSTER: 'cluster-1',
    };

    const config = loadMonitoringConfig();

    expect(config).toEqual({
      enabled: false,
      provider: 'noop',
      environment: 'staging',
      cluster: 'cluster-1',
    });
  });

  it('should return Sentry config when monitoring is enabled', () => {
    window.KONFLUX_RUNTIME = {
      MONITORING_ENABLED: 'true',
      MONITORING_DSN: 'https://test@sentry.io/123',
      MONITORING_ENVIRONMENT: 'production',
      MONITORING_CLUSTER: 'prod-cluster',
      MONITORING_SAMPLE_RATE_ERRORS: '0.5',
    };

    const config = loadMonitoringConfig();

    expect(config).toEqual({
      enabled: true,
      provider: 'sentry',
      dsn: 'https://test@sentry.io/123',
      environment: 'production',
      cluster: 'prod-cluster',
      sampleRates: {
        errors: 0.5,
      },
    });
  });

  it('should use default values when optional fields are missing', () => {
    window.KONFLUX_RUNTIME = {
      MONITORING_ENABLED: 'true',
    };

    const config = loadMonitoringConfig();

    expect(config).toEqual({
      enabled: true,
      provider: 'sentry',
      dsn: '',
      environment: 'production',
      cluster: 'unknown',
      sampleRates: {
        errors: 1.0,
      },
    });
  });
});
