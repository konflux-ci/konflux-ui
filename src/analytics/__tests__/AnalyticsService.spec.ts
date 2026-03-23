import { AnalyticsService, AnalyticsUser, consumeLoginSignal } from '../AnalyticsService';
import { SHA256Hash, TrackEvents } from '../gen/analytics-types';

jest.mock('..', () => ({
  ...jest.requireActual('../gen/analytics-types'),
  getAnalytics: jest.fn(),
}));

jest.mock('../obfuscate', () => ({
  obfuscate: jest.fn(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { getAnalytics }: { getAnalytics: jest.Mock } = jest.requireMock('..');
const { obfuscate }: { obfuscate: jest.Mock } = jest.requireMock('../obfuscate');
const { logger: mockLogger }: { logger: Record<string, jest.Mock> } =
  jest.requireMock('~/monitoring/logger');

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

const testUser: AnalyticsUser = {
  email: 'test@example.com',
  preferredUsername: 'testuser',
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    jest.clearAllMocks();
    obfuscate.mockResolvedValue(FAKE_HASH);
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
    it('should call analytics.identify with user traits', () => {
      enableAnalytics();
      service.identify(testUser);

      expect(mockSegment.identify).toHaveBeenCalledWith('testuser', {
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('should pass undefined when preferredUsername is null', () => {
      enableAnalytics();
      service.identify({ email: 'test@example.com', preferredUsername: null });

      expect(mockSegment.identify).toHaveBeenCalledWith(undefined, {
        email: 'test@example.com',
        username: null,
      });
    });

    it('should not throw when analytics is undefined', () => {
      getAnalytics.mockReturnValue(undefined);
      expect(() => service.identify(testUser)).not.toThrow();
    });
  });

  describe('userLogin', () => {
    it('should identify the user and track a login event', async () => {
      enableAnalytics();
      service.userLogin(testUser);

      expect(mockSegment.identify).toHaveBeenCalledWith('testuser', {
        email: 'test@example.com',
        username: 'testuser',
      });
      expect(obfuscate).toHaveBeenCalledWith('testuser');

      await obfuscate.mock.results[0].value;

      expect(mockSegment.track).toHaveBeenCalledWith(TrackEvents.user_login_event, {
        userId: FAKE_HASH,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('User Logged In');
    });

    it('should not track when preferredUsername is null', () => {
      enableAnalytics();
      service.userLogin({ email: 'test@example.com', preferredUsername: null });

      expect(mockSegment.identify).toHaveBeenCalled();
      expect(obfuscate).not.toHaveBeenCalled();
      expect(mockSegment.track).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('User Logged In');
    });
  });

  describe('userLogout', () => {
    it('should track logout event and reset when user was logged in', async () => {
      const segment = enableAnalytics();

      service.userLogin(testUser);
      await obfuscate.mock.results[0].value;

      jest.clearAllMocks();
      getAnalytics.mockReturnValue(segment);

      service.userLogout();
      await Promise.resolve();

      expect(segment.track).toHaveBeenCalledWith(TrackEvents.user_logout_event, {
        userId: FAKE_HASH,
      });
      expect(segment.reset).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('User Logged Out');
    });

    it('should include common properties in the logout track call', async () => {
      const segment = enableAnalytics();
      service.setCommonProperties({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      });

      service.userLogin(testUser);
      await obfuscate.mock.results[0].value;

      jest.clearAllMocks();
      getAnalytics.mockReturnValue(segment);

      service.userLogout();
      await Promise.resolve();

      expect(segment.track).toHaveBeenCalledWith(TrackEvents.user_logout_event, {
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
        userId: FAKE_HASH,
      });
    });

    it('should just reset when no user was logged in', () => {
      const segment = enableAnalytics();
      service.userLogout();

      expect(segment.track).not.toHaveBeenCalled();
      expect(segment.reset).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('User Logged Out');
    });

    it('should not throw when analytics is undefined', () => {
      getAnalytics.mockReturnValue(undefined);
      expect(() => service.userLogout()).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith('User Logged Out');
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
