import { renderHook, act } from '@testing-library/react';
import { TrackEvents } from '~/analytics/gen/analytics-types';
import { useTrackAnalyticsEvent } from '~/analytics/hooks';
import { mockAnalyticsServiceFn } from '~/unit-test-utils';

jest.mock('~/analytics/conditional-checks', () => ({
  useIsAnalyticsEnabled: jest.fn(),
}));

const trackMock = mockAnalyticsServiceFn('track');

const { useIsAnalyticsEnabled }: { useIsAnalyticsEnabled: jest.Mock } = jest.requireMock(
  '~/analytics/conditional-checks',
);
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

  it('should return a stable reference when enabled state does not change', () => {
    useIsAnalyticsEnabled.mockReturnValue({ isAnalyticsEnabled: true });

    const { result, rerender } = renderHook(() => useTrackAnalyticsEvent());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
