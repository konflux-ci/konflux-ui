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

const flushAndWaitSpy = jest
  .spyOn(journeyCollector, 'flushAndWait')
  .mockImplementation(jest.fn());
const journeyResetSpy = jest.spyOn(journeyCollector, 'reset').mockImplementation(jest.fn());

const resetMock = mockAnalyticsServiceFn('reset');
const trackAndWaitMock = mockAnalyticsServiceFn('trackAndWait');

describe('useAuthAnalytics', () => {
  let mockTrackEvent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent = jest.fn();
    useTrackAnalyticsEvent.mockReturnValue(mockTrackEvent);
    trackAndWaitMock.mockResolvedValue(true);
    flushAndWaitSpy.mockResolvedValue(true);
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
    it('awaits the logout and journey events reaching the network, then resets', async () => {
      const callOrder: string[] = [];
      trackAndWaitMock.mockImplementation(() => {
        callOrder.push('trackAndWait');
        return Promise.resolve(true);
      });
      flushAndWaitSpy.mockImplementation(() => {
        callOrder.push('flushAndWait');
        return Promise.resolve(true);
      });
      journeyResetSpy.mockImplementation(() => callOrder.push('journeyReset'));
      resetMock.mockImplementation(() => callOrder.push('reset'));
      const { result } = renderHook(() => useAuthAnalytics());

      await act(async () => {
        await result.current.onLogout();
      });

      expect(trackAndWaitMock).toHaveBeenCalledWith(TrackEvents.user_logout_event, {});
      expect(flushAndWaitSpy).toHaveBeenCalledWith({ force: true });
      expect(journeyResetSpy).toHaveBeenCalled();
      expect(resetMock).toHaveBeenCalled();
      // Both network sends must be awaited before the collector/session reset.
      expect(callOrder.slice(0, 2).sort()).toEqual(['flushAndWait', 'trackAndWait']);
      expect(callOrder.slice(2)).toEqual(['journeyReset', 'reset']);
      expect(logger.info).toHaveBeenCalledWith('User Logged Out');
    });

    it('does not hang forever if the network never resolves', async () => {
      jest.useFakeTimers();
      trackAndWaitMock.mockReturnValue(new Promise(() => {}));
      flushAndWaitSpy.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useAuthAnalytics());

      const logoutPromise = result.current.onLogout();
      await act(async () => {
        jest.advanceTimersByTime(2000);
        await logoutPromise;
      });

      expect(journeyResetSpy).toHaveBeenCalled();
      expect(resetMock).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('User Logged Out');
      jest.useRealTimers();
    });
  });
});
