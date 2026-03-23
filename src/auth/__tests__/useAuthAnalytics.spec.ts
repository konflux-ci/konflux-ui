import { renderHook, act } from '@testing-library/react';
import { SHA256Hash, TrackEvents } from '~/analytics/gen/analytics-types';
import { mockAnalyticsServiceFn } from '~/unit-test-utils';
import { useAuthAnalytics } from '../useAuthAnalytics';

jest.mock('~/analytics/obfuscate', () => ({
  obfuscate: jest.fn(),
}));

jest.mock('~/analytics/hooks', () => ({
  useTrackAnalyticsEvent: jest.fn(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { obfuscate }: { obfuscate: jest.Mock } = jest.requireMock('~/analytics/obfuscate');
const { useTrackAnalyticsEvent }: { useTrackAnalyticsEvent: jest.Mock } =
  jest.requireMock('~/analytics/hooks');
const { logger }: { logger: Record<string, jest.Mock> } = jest.requireMock('~/monitoring/logger');

const FAKE_HASH = 'abc123def456' as SHA256Hash;
const identifyMock = mockAnalyticsServiceFn('identify');
const resetMock = mockAnalyticsServiceFn('reset');

const testUser = { email: 'test@example.com', preferredUsername: 'testuser' };

describe('useAuthAnalytics', () => {
  let mockTrackEvent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent = jest.fn();
    useTrackAnalyticsEvent.mockReturnValue(mockTrackEvent);
    obfuscate.mockResolvedValue(FAKE_HASH);
  });

  describe('onLogin', () => {
    it('should identify the user and track a login event', async () => {
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogin(testUser);
      });

      expect(obfuscate).toHaveBeenCalledWith('testuser');

      await obfuscate.mock.results[0].value;

      expect(identifyMock).toHaveBeenCalledWith(FAKE_HASH);
      expect(mockTrackEvent).toHaveBeenCalledWith(TrackEvents.user_login_event, {
        userId: FAKE_HASH,
      });
      expect(logger.info).toHaveBeenCalledWith('User Logged In');
    });

    it('should not track or identify when preferredUsername is null', () => {
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogin({ email: 'test@example.com', preferredUsername: null });
      });

      expect(identifyMock).not.toHaveBeenCalled();
      expect(obfuscate).not.toHaveBeenCalled();
      expect(mockTrackEvent).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('User Logged In');
    });
  });

  describe('onLogout', () => {
    it('should track logout event and reset analytics', async () => {
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogout(testUser);
      });

      expect(obfuscate).toHaveBeenCalledWith('testuser');

      await obfuscate.mock.results[0].value;

      expect(mockTrackEvent).toHaveBeenCalledWith(TrackEvents.user_logout_event, {
        userId: FAKE_HASH,
      });
      expect(resetMock).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('User Logged Out');
    });

    it('should just reset when preferredUsername is null', () => {
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogout({ email: null, preferredUsername: null });
      });

      expect(obfuscate).not.toHaveBeenCalled();
      expect(mockTrackEvent).not.toHaveBeenCalled();
      expect(resetMock).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('User Logged Out');
    });
  });
});
