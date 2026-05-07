import { renderHook, act } from '@testing-library/react';
import { SHA256Hash, TrackEvents } from '~/analytics/gen/analytics-types';
import { mockAnalyticsServiceFn } from '~/unit-test-utils';
import { useAuthAnalytics } from '../useAuthAnalytics';

jest.mock('~/analytics/hooks', () => ({
  useTrackAnalyticsEvent: jest.fn(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { useTrackAnalyticsEvent }: { useTrackAnalyticsEvent: jest.Mock } =
  jest.requireMock('~/analytics/hooks');
const { logger }: { logger: Record<string, jest.Mock> } = jest.requireMock('~/monitoring/logger');

const FAKE_HASH = 'abc123def456' as SHA256Hash;
const identifyMock = mockAnalyticsServiceFn('identify');
const resetMock = mockAnalyticsServiceFn('reset');
const getCommonPropertiesMock = mockAnalyticsServiceFn('getCommonProperties');

describe('useAuthAnalytics', () => {
  let mockTrackEvent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent = jest.fn();
    useTrackAnalyticsEvent.mockReturnValue(mockTrackEvent);
    getCommonPropertiesMock.mockReturnValue({ userId: FAKE_HASH });
  });

  describe('onLogin', () => {
    it('should identify the user and track a login event', () => {
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogin();
      });

      expect(getCommonPropertiesMock).toHaveBeenCalled();
      expect(identifyMock).toHaveBeenCalledWith(FAKE_HASH);
      expect(mockTrackEvent).toHaveBeenCalledWith(TrackEvents.user_login_event, {
        userId: FAKE_HASH,
      });
      expect(logger.info).toHaveBeenCalledWith('User Logged In');
    });

    it('should still identify and track when common properties omit userId', () => {
      getCommonPropertiesMock.mockReturnValue({});
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogin();
      });

      expect(identifyMock).toHaveBeenCalledWith(undefined);
      expect(mockTrackEvent).toHaveBeenCalledWith(TrackEvents.user_login_event, {
        userId: undefined,
      });
      expect(logger.info).toHaveBeenCalledWith('User Logged In');
    });
  });

  describe('onLogout', () => {
    it('should track logout event and reset analytics', () => {
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogout();
      });

      expect(getCommonPropertiesMock).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenCalledWith(TrackEvents.user_logout_event, {
        userId: FAKE_HASH,
      });
      expect(resetMock).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('User Logged Out');
    });

    it('should still track logout and reset when common properties omit userId', () => {
      getCommonPropertiesMock.mockReturnValue({});
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogout();
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(TrackEvents.user_logout_event, {
        userId: undefined,
      });
      expect(resetMock).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('User Logged Out');
    });
  });
});
