import { mockConsole, MockConsole } from '~/unit-test-utils';
import type { AnalyticsConfig } from '../types';

// Mock the Segment SDK
const mockAnalyticsInstance = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  group: jest.fn(),
  alias: jest.fn(),
};

const mockAnalyticsBrowser = {
  load: jest.fn().mockResolvedValue([mockAnalyticsInstance, {}]),
};

jest.mock('@segment/analytics-next', () => ({
  AnalyticsBrowser: mockAnalyticsBrowser,
}));

jest.mock('../load-config', () => ({
  loadAnalyticsConfig: jest.fn(),
}));

describe('initAnalytics and getAnalytics', () => {
  let consoleMock: MockConsole;
  let loadAnalyticsConfigMock: jest.Mock;

  beforeEach(() => {
    consoleMock = mockConsole();
    jest.resetModules();
    loadAnalyticsConfigMock = jest.requireMock('../load-config').loadAnalyticsConfig;
    mockAnalyticsBrowser.load.mockResolvedValue([mockAnalyticsInstance, {}]);
  });

  afterEach(() => {
    consoleMock.restore();
    jest.clearAllMocks();
  });

  describe('initAnalytics', () => {
    it('should successfully initialize with valid config', async () => {
      const mockConfig: AnalyticsConfig = {
        enabled: true,
        writeKey: 'test-write-key-123',
        apiUrl: 'https://api.segment.io/v1',
      };
      loadAnalyticsConfigMock.mockReturnValue(mockConfig);

      const indexModule = await import('../index');
      await indexModule.initAnalytics();

      expect(loadAnalyticsConfigMock).toHaveBeenCalled();
      expect(mockAnalyticsBrowser.load).toHaveBeenCalledWith(
        { writeKey: 'test-write-key-123' },
        {
          integrations: {
            'Segment.io': {
              apiHost: 'https://api.segment.io/v1',
              protocol: 'https',
            },
          },
        },
      );
      expect(indexModule.getAnalytics()).toBe(mockAnalyticsInstance);
      expect(consoleMock.info).toHaveBeenCalledWith('Analytics loaded');
    });

    it('should not load SDK when analytics is disabled', async () => {
      const mockConfig: AnalyticsConfig = {
        enabled: false,
        writeKey: 'test-write-key-123',
        apiUrl: '',
      };
      loadAnalyticsConfigMock.mockReturnValue(mockConfig);

      const indexModule = await import('../index');
      await indexModule.initAnalytics();

      expect(loadAnalyticsConfigMock).toHaveBeenCalled();
      expect(mockAnalyticsBrowser.load).not.toHaveBeenCalled();
      expect(indexModule.getAnalytics()).toBeUndefined();
    });

    it('should not load SDK when apiUrl is missing', async () => {
      const mockConfig: AnalyticsConfig = {
        enabled: true,
        writeKey: 'test-write-key-123',
        apiUrl: '',
      };
      loadAnalyticsConfigMock.mockReturnValue(mockConfig);

      const indexModule = await import('../index');
      await indexModule.initAnalytics();

      expect(mockAnalyticsBrowser.load).not.toHaveBeenCalled();
      expect(indexModule.getAnalytics()).toBeUndefined();
    });

    it('should not load SDK when apiUrl is only whitespace', async () => {
      const mockConfig: AnalyticsConfig = {
        enabled: true,
        writeKey: 'test-write-key-123',
        apiUrl: '  ',
      };
      loadAnalyticsConfigMock.mockReturnValue(mockConfig);

      const indexModule = await import('../index');
      await indexModule.initAnalytics();

      expect(mockAnalyticsBrowser.load).not.toHaveBeenCalled();
      expect(indexModule.getAnalytics()).toBeUndefined();
    });

    it('should not load SDK when write key is missing', async () => {
      const mockConfig: AnalyticsConfig = {
        enabled: true,
        writeKey: '',
        apiUrl: '',
      };
      loadAnalyticsConfigMock.mockReturnValue(mockConfig);

      const indexModule = await import('../index');
      await indexModule.initAnalytics();

      expect(mockAnalyticsBrowser.load).not.toHaveBeenCalled();
      expect(indexModule.getAnalytics()).toBeUndefined();
    });

    it('should not load SDK when write key is only whitespace', async () => {
      const mockConfig: AnalyticsConfig = {
        enabled: true,
        writeKey: '   ',
        apiUrl: '',
      };
      loadAnalyticsConfigMock.mockReturnValue(mockConfig);

      const indexModule = await import('../index');
      await indexModule.initAnalytics();

      expect(mockAnalyticsBrowser.load).not.toHaveBeenCalled();
      expect(indexModule.getAnalytics()).toBeUndefined();
    });

    it('should trim write key and apiUrl before using', async () => {
      const mockConfig: AnalyticsConfig = {
        enabled: true,
        writeKey: '  test-key  ',
        apiUrl: '  https://api.example.com  ',
      };
      loadAnalyticsConfigMock.mockReturnValue(mockConfig);

      const indexModule = await import('../index');
      await indexModule.initAnalytics();

      expect(mockAnalyticsBrowser.load).toHaveBeenCalledWith(
        { writeKey: 'test-key' },
        {
          integrations: {
            'Segment.io': {
              apiHost: 'https://api.example.com',
              protocol: 'https',
            },
          },
        },
      );
    });

    it('should handle initialization errors gracefully', async () => {
      const mockConfig: AnalyticsConfig = {
        enabled: true,
        writeKey: 'test-write-key-123',
        apiUrl: 'https://api.segment.io/v1',
      };
      loadAnalyticsConfigMock.mockReturnValue(mockConfig);

      const initError = new Error('Failed to load Segment SDK');
      mockAnalyticsBrowser.load.mockRejectedValue(initError);

      const indexModule = await import('../index');
      await indexModule.initAnalytics();

      expect(consoleMock.error).toHaveBeenCalledWith('Error loading Analytics', initError);
      expect(indexModule.getAnalytics()).toBeUndefined();
    });
  });

  describe('getAnalytics', () => {
    it('should return undefined when analytics is not initialized', async () => {
      const indexModule = await import('../index');
      expect(indexModule.getAnalytics()).toBeUndefined();
    });

    it('should return analytics instance after successful initialization', async () => {
      const mockConfig: AnalyticsConfig = {
        enabled: true,
        writeKey: 'test-write-key-123',
        apiUrl: 'https://api.segment.io/v1',
      };
      loadAnalyticsConfigMock.mockReturnValue(mockConfig);

      const indexModule = await import('../index');
      expect(indexModule.getAnalytics()).toBeUndefined();

      await indexModule.initAnalytics();
      expect(indexModule.getAnalytics()).toBe(mockAnalyticsInstance);
    });
  });
});
