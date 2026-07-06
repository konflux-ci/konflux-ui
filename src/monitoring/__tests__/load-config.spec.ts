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

  it('should use default environment/cluster when disabled and values not provided', () => {
    window.KONFLUX_RUNTIME = {
      MONITORING_ENABLED: 'false',
    };

    const config = loadMonitoringConfig();

    expect(config).toEqual({
      enabled: false,
      provider: 'noop',
      environment: 'development',
      cluster: 'local',
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
        traces: 0.2,
      },
    });
  });

  it('should return noop config when enabled but DSN is empty', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    window.KONFLUX_RUNTIME = {
      MONITORING_ENABLED: 'true',
      MONITORING_DSN: '',
      MONITORING_ENVIRONMENT: 'production',
      MONITORING_CLUSTER: 'prod-cluster',
    };

    const config = loadMonitoringConfig();

    expect(config).toEqual({
      enabled: false,
      provider: 'noop',
      environment: 'production',
      cluster: 'prod-cluster',
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('MONITORING_DSN is empty'));

    warnSpy.mockRestore();
  });

  it('should return noop config when enabled but DSN is missing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    window.KONFLUX_RUNTIME = {
      MONITORING_ENABLED: 'true',
    };

    const config = loadMonitoringConfig();

    expect(config).toEqual({
      enabled: false,
      provider: 'noop',
      environment: 'development',
      cluster: 'local',
    });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should parse MONITORING_SAMPLE_RATE_TRACES from runtime config', () => {
    window.KONFLUX_RUNTIME = {
      MONITORING_ENABLED: 'true',
      MONITORING_DSN: 'https://test@sentry.io/123',
      MONITORING_SAMPLE_RATE_TRACES: '0.5',
    };

    const config = loadMonitoringConfig();

    expect(config.sampleRates).toEqual(
      expect.objectContaining({
        traces: 0.5,
      }),
    );
  });

  it('should default traces sample rate to 0.2 when not provided', () => {
    window.KONFLUX_RUNTIME = {
      MONITORING_ENABLED: 'true',
      MONITORING_DSN: 'https://test@sentry.io/123',
    };

    const config = loadMonitoringConfig();

    expect(config.sampleRates).toEqual(
      expect.objectContaining({
        traces: 0.2,
      }),
    );
  });
});
