import { loadAnalyticsConfig } from '../load-config';

describe('loadAnalyticsConfig', () => {
  const originalKonfluxRuntime = window.KONFLUX_RUNTIME;

  afterEach(() => {
    window.KONFLUX_RUNTIME = originalKonfluxRuntime;
  });

  it('should return default config when window.KONFLUX_RUNTIME is undefined', () => {
    window.KONFLUX_RUNTIME = undefined;

    const config = loadAnalyticsConfig();

    expect(config).toEqual({
      enabled: false,
      writeKey: undefined,
      apiUrl: undefined,
    });
  });

  it('should return default config when ANALYTICS_ENABLED is false', () => {
    window.KONFLUX_RUNTIME = {
      ANALYTICS_ENABLED: 'false',
      ANALYTICS_WRITE_KEY: 'some-key',
      ANALYTICS_API_URL: 'https://api.example.com',
    };

    const config = loadAnalyticsConfig();

    expect(config).toEqual({
      enabled: false,
      writeKey: undefined,
      apiUrl: undefined,
    });
  });

  it('should return default config when only ANALYTICS_ENABLED is set to false', () => {
    window.KONFLUX_RUNTIME = {
      ANALYTICS_ENABLED: 'false',
    };

    const config = loadAnalyticsConfig();

    expect(config).toEqual({
      enabled: false,
      writeKey: undefined,
      apiUrl: undefined,
    });
  });

  it('should return full config when analytics is enabled with all fields set', () => {
    window.KONFLUX_RUNTIME = {
      ANALYTICS_ENABLED: 'true',
      ANALYTICS_WRITE_KEY: 'segment-write-key-123',
      ANALYTICS_API_URL: 'https://api.segment.io/v1',
    };

    const config = loadAnalyticsConfig();

    expect(config).toEqual({
      enabled: true,
      writeKey: 'segment-write-key-123',
      apiUrl: 'https://api.segment.io/v1',
    });
  });

  it('should use empty string fallbacks when write key and api url are missing', () => {
    window.KONFLUX_RUNTIME = {
      ANALYTICS_ENABLED: 'true',
    };

    const config = loadAnalyticsConfig();

    expect(config).toEqual({
      enabled: true,
      writeKey: '',
      apiUrl: '',
    });
  });
});
