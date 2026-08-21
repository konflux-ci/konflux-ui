import { renderHook, act } from '@testing-library/react';
import { TrackEvents } from '~/analytics/gen/analytics-types';
import { journeyCollector } from '~/analytics/JourneyCollector';
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
const flushSpy = jest.spyOn(journeyCollector, 'flush').mockImplementation(jest.fn());
const journeyResetSpy = jest.spyOn(journeyCollector, 'reset').mockImplementation(jest.fn());

const resetMock = mockAnalyticsServiceFn('reset');

describe('useAuthAnalytics', () => {
  let mockTrackEvent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent = jest.fn();
    useTrackAnalyticsEvent.mockReturnValue(mockTrackEvent);
  });

  describe('onLogin', () => {
    it('should track a login event without a user identifier', () => {
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogin();
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(TrackEvents.user_login_event, {});
      expect(logger.info).toHaveBeenCalledWith('User Logged In');
    });
  });

  describe('onLogout', () => {
    it('tracks logout, then flushes and resets journey and identity in order', () => {
      const callOrder: string[] = [];
      flushSpy.mockImplementation(() => {
        callOrder.push('flush');
        return true;
      });
      journeyResetSpy.mockImplementation(() => callOrder.push('journeyReset'));
      resetMock.mockImplementation(() => callOrder.push('reset'));
      const { result } = renderHook(() => useAuthAnalytics());

      act(() => {
        result.current.onLogout();
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(TrackEvents.user_logout_event, {});
      expect(flushSpy).toHaveBeenCalledWith({ force: true });
      expect(journeyResetSpy).toHaveBeenCalled();
      expect(resetMock).toHaveBeenCalled();
      expect(callOrder).toEqual(['flush', 'journeyReset', 'reset']);
      expect(logger.info).toHaveBeenCalledWith('User Logged Out');
    });
  });
});
