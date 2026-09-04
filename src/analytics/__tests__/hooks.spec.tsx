import { renderHook, act } from '@testing-library/react';
import { createReactRouterMock, mockAnalyticsServiceFn } from '~/unit-test-utils';
import { TrackEvents } from '../gen/analytics-types';
import { useJourneyTracker, useTrackAnalyticsEvent } from '../hooks';
import { journeyCollector } from '../JourneyCollector';

jest.mock('../conditional-checks', () => ({
  useIsAnalyticsEnabled: jest.fn(),
}));

const trackMock = mockAnalyticsServiceFn('track');

const { useIsAnalyticsEnabled }: { useIsAnalyticsEnabled: jest.Mock } =
  jest.requireMock('../conditional-checks');
describe('useTrackAnalyticsEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call track when analytics is enabled', () => {
    useIsAnalyticsEnabled.mockReturnValue({ isAnalyticsEnabled: true });

    const { result } = renderHook(() => useTrackAnalyticsEvent());

    act(() => {
      result.current(TrackEvents.user_login_event, {});
    });

    expect(trackMock).toHaveBeenCalledWith(TrackEvents.user_login_event, {});
  });

  it('should not call track when analytics is disabled', () => {
    useIsAnalyticsEnabled.mockReturnValue({ isAnalyticsEnabled: false });

    const { result } = renderHook(() => useTrackAnalyticsEvent());

    act(() => {
      result.current(TrackEvents.user_login_event, {});
    });

    expect(trackMock).not.toHaveBeenCalled();
  });

});

describe('useJourneyTracker', () => {
  const useMatchesMock = createReactRouterMock('useMatches');
  const recordStepSpy = jest.spyOn(journeyCollector, 'recordStep').mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    useIsAnalyticsEnabled.mockReturnValue({ isAnalyticsEnabled: true });
    useMatchesMock.mockReturnValue([
      { handle: { routePattern: '/' } },
      { handle: { routePattern: '/ns/:workspaceName/applications' } },
    ]);
  });

  it('records route patterns on mount and navigation', () => {
    const { rerender } = renderHook(() => useJourneyTracker());

    expect(recordStepSpy).toHaveBeenCalledWith('/ns/:workspaceName/applications');

    useMatchesMock.mockReturnValue([
      { handle: { routePattern: '/' } },
      { handle: { routePattern: '/ns/:workspaceName/applications/:applicationName' } },
    ]);
    rerender();

    expect(recordStepSpy).toHaveBeenCalledTimes(2);
    expect(recordStepSpy).toHaveBeenLastCalledWith(
      '/ns/:workspaceName/applications/:applicationName',
    );
  });

  it('does not record when analytics is disabled', () => {
    const { rerender } = renderHook(() => useJourneyTracker());

    useIsAnalyticsEnabled.mockReturnValue({ isAnalyticsEnabled: false });
    rerender();

    expect(recordStepSpy).toHaveBeenCalledTimes(1);
  });

  it('uses a safe fallback when the matched route has no pattern', () => {
    useMatchesMock.mockReturnValue([{ handle: {} }]);

    renderHook(() => useJourneyTracker());

    expect(recordStepSpy).toHaveBeenCalledWith('/unknown');
  });
});
