import { AnalyticsService, consumeLoginSignal } from '../AnalyticsService';
import { SHA256Hash, TrackEvents } from '../gen/analytics-types';

jest.mock('..', () => ({
  ...jest.requireActual('../gen/analytics-types'),
  getAnalytics: jest.fn(),
}));

const { getAnalytics }: { getAnalytics: jest.Mock } = jest.requireMock('..');

const FAKE_HASH = 'abc123def456' as SHA256Hash;

const mockSegment = {
  track: jest.fn(),
  page: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
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
  });

  describe('setCommonProperties / getCommonProperties', () => {
    it('should start with empty common properties', () => {
      expect(service.getCommonProperties()).toEqual({});
    });

    it('should set common properties', () => {
      service.setCommonProperties({ clusterVersion: '4.14' });
      expect(service.getCommonProperties()).toEqual({ clusterVersion: '4.14' });
    });

    it('should merge with existing properties', () => {
      service.setCommonProperties({ clusterVersion: '4.14' });
      service.setCommonProperties({ konfluxVersion: '1.0' });
      expect(service.getCommonProperties()).toEqual({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
      });
    });

    it('should override existing keys on merge', () => {
      service.setCommonProperties({ clusterVersion: '4.14' });
      service.setCommonProperties({ clusterVersion: '4.15' });
      expect(service.getCommonProperties()).toEqual({ clusterVersion: '4.15' });
    });

    it('should return a copy, not a reference', () => {
      service.setCommonProperties({ clusterVersion: '4.14' });
      const props = service.getCommonProperties();
      (props as Record<string, string>).clusterVersion = 'mutated';
      expect(service.getCommonProperties()).toEqual({ clusterVersion: '4.14' });
    });
  });

  describe('track', () => {
    it('should call analytics.track with merged properties', () => {
      enableAnalytics();
      service.setCommonProperties({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });

      service.track(TrackEvents.user_login_event, { userId: FAKE_HASH });

      expect(mockSegment.track).toHaveBeenCalledWith(TrackEvents.user_login_event, {
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
        userId: FAKE_HASH,
      });
    });

    it('should not throw when analytics is undefined', () => {
      getAnalytics.mockReturnValue(undefined);
      expect(() =>
        service.track(TrackEvents.user_login_event, { userId: FAKE_HASH }),
      ).not.toThrow();
      expect(mockSegment.track).not.toHaveBeenCalled();
    });
  });

  describe('page', () => {
    it('should call analytics.page with name and merged properties', () => {
      enableAnalytics();
      service.setCommonProperties({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });

      service.page('Dashboard', { section: 'overview' });

      expect(mockSegment.page).toHaveBeenCalledWith('Dashboard', {
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
        section: 'overview',
      });
    });

    it('should work without name or properties', () => {
      enableAnalytics();
      service.page();
      expect(mockSegment.page).toHaveBeenCalledWith(undefined, {});
    });

    it('should not throw when analytics is undefined', () => {
      getAnalytics.mockReturnValue(undefined);
      expect(() => service.page('Test')).not.toThrow();
      expect(mockSegment.page).not.toHaveBeenCalled();
    });
  });

  describe('identify', () => {
    it('should call analytics.identify with userId', () => {
      enableAnalytics();
      service.identify('user-hash-123');

      expect(mockSegment.identify).toHaveBeenCalledWith('user-hash-123');
    });

    it('should not throw when analytics is undefined', () => {
      getAnalytics.mockReturnValue(undefined);
      expect(() => service.identify('user-hash-123')).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should call analytics.reset', () => {
      enableAnalytics();
      service.reset();
      expect(mockSegment.reset).toHaveBeenCalled();
    });

    it('should not throw when analytics is undefined', () => {
      getAnalytics.mockReturnValue(undefined);
      expect(() => service.reset()).not.toThrow();
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

  it('should return true and strip the param when logged_in is present', () => {
    setLocation('?logged_in=1');
    expect(consumeLoginSignal()).toBe(true);
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/app');
  });

  it('should preserve other query params when stripping logged_in', () => {
    setLocation('?logged_in=1&foo=bar');
    expect(consumeLoginSignal()).toBe(true);
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/app?foo=bar');
  });

  it('should return false when logged_in is not present', () => {
    setLocation('?foo=bar');
    expect(consumeLoginSignal()).toBe(false);
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });

  it('should return false when there are no query params', () => {
    setLocation('');
    expect(consumeLoginSignal()).toBe(false);
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });

  it('should preserve the hash fragment', () => {
    setLocation('?logged_in=1', '/app', '#section');
    expect(consumeLoginSignal()).toBe(true);
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/app#section');
  });
});
