import { loadAnalyticsConfig } from '../load-config';

describe('loadAnalyticsConfig', () => {
  const originalKonfluxRuntime = window.KONFLUX_RUNTIME;

  beforeEach(() => {
    jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    window.KONFLUX_RUNTIME = originalKonfluxRuntime;
    jest.restoreAllMocks();
  });

  describe('when /segment APIs are available', () => {
    it('should return config from APIs when both respond successfully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/segment/key') {
          return Promise.resolve({ ok: true, text: () => Promise.resolve('api-write-key-123') });
        }
        if (url === '/segment/url') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('https://api.segment.io/v1'),
          });
        }
        return Promise.reject(new Error('unexpected url'));
      });

      const config = await loadAnalyticsConfig();

      expect(config).toEqual({
        enabled: true,
        writeKey: 'api-write-key-123',
        apiUrl: 'https://api.segment.io/v1',
      });
    });

    it('should trim whitespace from API responses', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/segment/key') {
          return Promise.resolve({ ok: true, text: () => Promise.resolve('  key-123  \n') });
        }
        if (url === '/segment/url') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('  https://api.example.com  \n'),
          });
        }
        return Promise.reject(new Error('unexpected url'));
      });

      const config = await loadAnalyticsConfig();

      expect(config).toEqual({
        enabled: true,
        writeKey: 'key-123',
        apiUrl: 'https://api.example.com',
      });
    });

    it('should fall back to runtime config when key API returns empty', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/segment/key') {
          return Promise.resolve({ ok: true, text: () => Promise.resolve('') });
        }
        if (url === '/segment/url') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('https://api.segment.io/v1'),
          });
        }
        return Promise.reject(new Error('unexpected url'));
      });

      window.KONFLUX_RUNTIME = { ANALYTICS_ENABLED: 'false' };

      const config = await loadAnalyticsConfig();

      expect(config).toEqual({
        enabled: false,
        writeKey: undefined,
        apiUrl: undefined,
      });
    });
  });

  describe('when /segment APIs fail', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    });

    it('should fall back to runtime config when APIs fail', async () => {
      window.KONFLUX_RUNTIME = {
        ANALYTICS_ENABLED: 'true',
        ANALYTICS_WRITE_KEY: 'runtime-key',
        ANALYTICS_API_URL: 'https://runtime.example.com',
      };

      const config = await loadAnalyticsConfig();

      expect(config).toEqual({
        enabled: true,
        writeKey: 'runtime-key',
        apiUrl: 'https://runtime.example.com',
      });
    });

    it('should return default config when runtime is undefined', async () => {
      window.KONFLUX_RUNTIME = undefined;

      const config = await loadAnalyticsConfig();

      expect(config).toEqual({
        enabled: false,
        writeKey: undefined,
        apiUrl: undefined,
      });
    });

    it('should return default config when ANALYTICS_ENABLED is false', async () => {
      window.KONFLUX_RUNTIME = {
        ANALYTICS_ENABLED: 'false',
        ANALYTICS_WRITE_KEY: 'some-key',
        ANALYTICS_API_URL: 'https://api.example.com',
      };

      const config = await loadAnalyticsConfig();

      expect(config).toEqual({
        enabled: false,
        writeKey: undefined,
        apiUrl: undefined,
      });
    });

    it('should use empty string fallbacks when write key and api url are missing in runtime', async () => {
      window.KONFLUX_RUNTIME = {
        ANALYTICS_ENABLED: 'true',
      };

      const config = await loadAnalyticsConfig();

      expect(config).toEqual({
        enabled: true,
        writeKey: '',
        apiUrl: '',
      });
    });
  });

  describe('when /segment APIs return non-ok responses', () => {
    it('should fall back to runtime config when key API returns 404', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/segment/key') {
          return Promise.resolve({ ok: false, status: 404 });
        }
        if (url === '/segment/url') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('https://api.segment.io/v1'),
          });
        }
        return Promise.reject(new Error('unexpected url'));
      });

      window.KONFLUX_RUNTIME = {
        ANALYTICS_ENABLED: 'true',
        ANALYTICS_WRITE_KEY: 'fallback-key',
        ANALYTICS_API_URL: 'https://fallback.example.com',
      };

      const config = await loadAnalyticsConfig();

      expect(config).toEqual({
        enabled: true,
        writeKey: 'fallback-key',
        apiUrl: 'https://fallback.example.com',
      });
    });
  });
});
