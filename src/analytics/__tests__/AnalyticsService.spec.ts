import { AnalyticsService, consumeLoginSignal } from '~/analytics/AnalyticsService';
import { TrackEvents } from '~/analytics/gen/analytics-types';
import type { SHA256Hash } from '~/analytics/obfuscate';

jest.mock('~/analytics/analytics-client', () => ({
  getAnalytics: jest.fn(),
}));

const { getAnalytics }: { getAnalytics: jest.Mock } = jest.requireMock(
  '~/analytics/analytics-client',
);

const mockSegment = {
  identify: jest.fn(),
  track: jest.fn(),
  reset: jest.fn(),
  setAnonymousId: jest.fn(),
};

const enableAnalytics = () => {
  getAnalytics.mockReturnValue(mockSegment);
  return mockSegment;
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    jest.clearAllMocks();
    mockSegment.track.mockResolvedValue(undefined);
  });

  describe('common properties', () => {
    it('should start with an in-memory session ID', () => {
      expect(service.getCommonProperties()).toEqual({
        sessionId: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        ),
      });
    });

    it('merges, overrides, and returns a defensive copy', () => {
      service.setCommonProperties({ clusterVersion: '4.14' });
      service.setCommonProperties({ konfluxVersion: '1.0' });
      service.setCommonProperties({ clusterVersion: '4.15' });
      const props = service.getCommonProperties();
      (props as Record<string, string>).clusterVersion = 'mutated';
      expect(service.getCommonProperties()).toEqual(
        expect.objectContaining({
          clusterVersion: '4.15',
          konfluxVersion: '1.0',
        }),
      );
    });

    it('returns required common properties without clusterVersion when it is unavailable', () => {
      expect(service.getReadyCommonProperties()).toBeUndefined();

      service.setCommonProperties({
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });

      expect(service.getReadyCommonProperties()).toEqual({
        sessionId: service.getCommonProperties().sessionId,
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });
    });
  });

  describe('track', () => {
    it('should inject the identified user ID into analytics.track properties', () => {
      enableAnalytics();
      const userId = 'pseudonymous-user-id' as SHA256Hash;
      service.identify(userId);
      service.setCommonProperties({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });

      const sent = service.track(TrackEvents.user_login_event, {});

      expect(mockSegment.track).toHaveBeenCalledWith(TrackEvents.user_login_event, {
        sessionId: service.getCommonProperties().sessionId,
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
        userId,
      });
      expect(sent).toBe(true);
    });

    it('omits an empty clusterVersion from Segment payloads', () => {
      enableAnalytics();
      const userId = 'pseudonymous-user-id' as SHA256Hash;
      service.identify(userId);
      service.setCommonProperties({
        clusterVersion: '',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });

      const sent = service.track(TrackEvents.user_login_event, {});

      expect(mockSegment.track).toHaveBeenCalledWith(TrackEvents.user_login_event, {
        sessionId: service.getCommonProperties().sessionId,
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
        userId,
      });
      expect(sent).toBe(true);
    });

    it('withholds events until a user ID is established', () => {
      enableAnalytics();
      service.setCommonProperties({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });

      expect(service.track(TrackEvents.user_login_event, {})).toBe(false);
      expect(mockSegment.track).not.toHaveBeenCalled();
    });

    it('withholds events when analytics or common properties are unavailable', () => {
      getAnalytics.mockReturnValue(undefined);
      expect(service.track(TrackEvents.user_login_event, {})).toBe(false);
      expect(mockSegment.track).not.toHaveBeenCalled();
    });
  });

  describe('trackAndWait', () => {
    it('resolves true only after analytics.track()\'s network call resolves', async () => {
      enableAnalytics();
      const userId = 'pseudonymous-user-id' as SHA256Hash;
      service.identify(userId);
      service.setCommonProperties({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });
      let resolveTrack: () => void = () => {};
      mockSegment.track.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveTrack = resolve;
        }),
      );

      let sent: boolean | undefined;
      const pending = service
        .trackAndWait(TrackEvents.user_logout_event, {})
        .then((result) => {
          sent = result;
        });

      expect(mockSegment.track).toHaveBeenCalledWith(TrackEvents.user_logout_event, {
        sessionId: service.getCommonProperties().sessionId,
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
        userId,
      });
      expect(sent).toBeUndefined();

      resolveTrack();
      await pending;

      expect(sent).toBe(true);
    });

    it('resolves false when required common properties are unavailable', async () => {
      enableAnalytics();
      service.identify('pseudonymous-user-id' as SHA256Hash);
      await expect(service.trackAndWait(TrackEvents.user_logout_event, {})).resolves.toBe(false);
      expect(mockSegment.track).not.toHaveBeenCalled();
    });

    it('resolves false until a user ID is established', async () => {
      enableAnalytics();
      service.setCommonProperties({
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });

      await expect(service.trackAndWait(TrackEvents.user_logout_event, {})).resolves.toBe(false);
      expect(mockSegment.track).not.toHaveBeenCalled();
    });

    it('resolves false when analytics.track() rejects', async () => {
      enableAnalytics();
      service.setCommonProperties({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });
      service.identify('pseudonymous-user-id' as SHA256Hash);
      mockSegment.track.mockRejectedValue(new Error('network error'));

      await expect(service.trackAndWait(TrackEvents.user_logout_event, {})).resolves.toBe(false);
    });
  });

  describe('reset', () => {
    it('should rotate the session ID and Segment anonymous ID while preserving versions', () => {
      enableAnalytics();
      service.setCommonProperties({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });
      const previousSessionId = service.getCommonProperties().sessionId;

      service.reset();

      const properties = service.getCommonProperties();
      expect(properties.sessionId).not.toBe(previousSessionId);
      expect(properties).toEqual(
        expect.objectContaining({
          clusterVersion: '4.14',
          konfluxVersion: '1.0',
          kubernetesVersion: '1.30',
        }),
      );
      expect(mockSegment.reset).toHaveBeenCalled();
      expect(mockSegment.setAnonymousId).toHaveBeenCalledWith(properties.sessionId);
    });
  });

  describe('identity', () => {
    const userId = 'pseudonymous-user-id' as SHA256Hash;

    it('retains identity until Segment is available', () => {
      getAnalytics.mockReturnValue(undefined);
      service.identify(userId);

      expect(service.getUserId()).toBe(userId);
      expect(mockSegment.identify).not.toHaveBeenCalled();
    });

    it('identifies immediately when Segment is available', () => {
      enableAnalytics();

      service.identify(userId);

      expect(service.getUserId()).toBe(userId);
      expect(mockSegment.identify).toHaveBeenCalledWith(userId);
    });

    it('clears identity on reset', () => {
      enableAnalytics();
      service.identify(userId);

      service.reset();

      expect(service.getUserId()).toBeUndefined();
    });
  });
});

describe('consumeLoginSignal', () => {
  const originalLocation = window.location;
  const replaceStateSpy = jest.spyOn(window.history, 'replaceState');

  afterEach(() => {
    replaceStateSpy.mockClear();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  const setLocation = (search: string, pathname = '/app', hash = '') => {
    Object.defineProperty(window, 'location', {
      value: { pathname, search, hash },
      writable: true,
    });
  };

  it.each([
    ['?logged_in=1', '', true, '/app'],
    ['?logged_in=1&foo=bar', '', true, '/app?foo=bar'],
    ['?logged_in=1', '#section', true, '/app#section'],
    ['?foo=bar', '', false, undefined],
    ['', '', false, undefined],
  ])('consumes login signal from %s', (search, hash, consumed, replacement) => {
    setLocation(search, '/app', hash);
    expect(consumeLoginSignal()).toBe(consumed);
    if (replacement) {
      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', replacement);
    } else {
      expect(replaceStateSpy).not.toHaveBeenCalled();
    }
  });
});
