import { mockConsole, MockConsole } from '~/unit-test-utils';
import type { SHA256Hash } from '../obfuscate';
import type { AnalyticsConfig } from '../types';

const mockAnalyticsInstance = {
  track: jest.fn(), identify: jest.fn(), page: jest.fn(), group: jest.fn(), alias: jest.fn(), setAnonymousId: jest.fn(),
};
const mockAnalyticsBrowser = { load: jest.fn().mockResolvedValue([mockAnalyticsInstance, {}]) };

jest.mock('@segment/analytics-next', () => ({ AnalyticsBrowser: mockAnalyticsBrowser }));
jest.mock('../load-config', () => ({ loadAnalyticsConfig: jest.fn() }));
jest.mock('../JourneyCollector', () => ({
  journeyCollector: { flush: jest.fn(), flushViaBeacon: jest.fn(), notifyHidden: jest.fn(), notifyVisible: jest.fn() },
}));

const validConfig: AnalyticsConfig = {
  enabled: true,
  writeKey: 'test-write-key-123',
  apiUrl: 'https://api.segment.io/v1',
};

describe('analytics initialization', () => {
  let consoleMock: MockConsole;
  let loadAnalyticsConfig: jest.Mock;
  let journeyCollector: Record<string, jest.Mock>;

  beforeEach(() => {
    consoleMock = mockConsole();
    jest.resetModules();
    loadAnalyticsConfig = jest.requireMock('../load-config').loadAnalyticsConfig;
    journeyCollector = jest.requireMock('../JourneyCollector').journeyCollector;
    mockAnalyticsBrowser.load.mockResolvedValue([mockAnalyticsInstance, {}]);
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleMock.restore();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const init = async (config: AnalyticsConfig = validConfig) => {
    loadAnalyticsConfig.mockResolvedValue(config);
    const analytics = await import('../index');
    await analytics.initAnalytics();
    return analytics;
  };

  it('initializes Segment without persistent identity', async () => {
    const analytics = await init();

    expect(mockAnalyticsBrowser.load).toHaveBeenCalledWith(
      { writeKey: validConfig.writeKey },
      {
        disableClientPersistence: true,
        integrations: { 'Segment.io': { apiHost: 'api.segment.io', protocol: 'https' } },
      },
    );
    expect(mockAnalyticsInstance.setAnonymousId).toHaveBeenCalledWith(expect.any(String));
    expect(analytics.getAnalytics()).toBe(mockAnalyticsInstance);
    await expect(analytics.whenAnalyticsReady()).resolves.toBe(true);
    expect(consoleMock.info).toHaveBeenCalledWith('Analytics loaded');
  });

  it('identifies an identity supplied before Segment initialization', async () => {
    loadAnalyticsConfig.mockResolvedValue(validConfig);
    const analytics = await import('../index');
    const { analyticsService } = await import('../AnalyticsService');
    const userId = 'pseudonymous-user-id' as SHA256Hash;

    analyticsService.identify(userId);
    await analytics.initAnalytics();

    expect(mockAnalyticsInstance.identify).toHaveBeenCalledWith(userId);
  });

  it.each([
    ['disabled', { ...validConfig, enabled: false }],
    ['missing API URL', { ...validConfig, apiUrl: '' }],
    ['blank API URL', { ...validConfig, apiUrl: '  ' }],
    ['missing write key', { ...validConfig, writeKey: '' }],
    ['blank write key', { ...validConfig, writeKey: '   ' }],
  ])('does not initialize for %s config', async (_label, config) => {
    const analytics = await init(config);

    expect(mockAnalyticsBrowser.load).not.toHaveBeenCalled();
    expect(analytics.getAnalytics()).toBeUndefined();
    await expect(analytics.whenAnalyticsReady()).resolves.toBe(false);
  });

  it('trims config values', async () => {
    await init({ enabled: true, writeKey: '  test-key  ', apiUrl: '  https://api.example.com  ' });

    expect(mockAnalyticsBrowser.load).toHaveBeenCalledWith(
      { writeKey: 'test-key' },
      expect.objectContaining({
        integrations: { 'Segment.io': { apiHost: 'api.example.com', protocol: 'https' } },
      }),
    );
  });

  it('handles SDK initialization errors', async () => {
    const error = new Error('Failed to load Segment SDK');
    mockAnalyticsBrowser.load.mockRejectedValue(error);

    const analytics = await init();

    expect(consoleMock.error).toHaveBeenCalledWith('Error loading Analytics', error);
    expect(analytics.getAnalytics()).toBeUndefined();
    await expect(analytics.whenAnalyticsReady()).resolves.toBe(false);
  });

  describe('session-end listeners', () => {
    let documentListenerSpy: jest.SpyInstance;
    let windowListenerSpy: jest.SpyInstance;

    beforeEach(() => {
      documentListenerSpy = jest.spyOn(document, 'addEventListener');
      windowListenerSpy = jest.spyOn(window, 'addEventListener');
    });

    const handlerFor = (spy: jest.SpyInstance, event: string): (() => void) => {
      const handler = spy.mock.calls.find(([name]) => name === event)?.[1];
      if (!handler) throw new Error(`No ${event} handler registered`);
      return handler as () => void;
    };

    it('delays hidden-tab flush and cancels it when visibility returns', async () => {
      jest.useFakeTimers();
      const analytics = await init();
      const handler = handlerFor(documentListenerSpy, 'visibilitychange');
      const visibility = jest.spyOn(document, 'visibilityState', 'get');

      visibility.mockReturnValue('hidden');
      handler();
      expect(journeyCollector.notifyHidden).toHaveBeenCalledTimes(1);
      expect(journeyCollector.flush).not.toHaveBeenCalled();

      jest.advanceTimersByTime(analytics.HIDDEN_FLUSH_DELAY_MS - 1);
      visibility.mockReturnValue('visible');
      handler();
      jest.advanceTimersByTime(1);

      expect(journeyCollector.notifyVisible).toHaveBeenCalledTimes(1);
      expect(journeyCollector.flush).not.toHaveBeenCalled();
    });

    it('flushes after the hidden delay', async () => {
      jest.useFakeTimers();
      const analytics = await init();
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

      handlerFor(documentListenerSpy, 'visibilitychange')();
      jest.advanceTimersByTime(analytics.HIDDEN_FLUSH_DELAY_MS);

      expect(journeyCollector.flush).toHaveBeenCalledTimes(1);
    });

    it('uses the unload beacon with resolved config', async () => {
      await init();

      handlerFor(windowListenerSpy, 'beforeunload')();

      expect(journeyCollector.flushViaBeacon).toHaveBeenCalledWith({
        writeKey: validConfig.writeKey,
        apiHost: 'api.segment.io',
      });
    });
  });
});
