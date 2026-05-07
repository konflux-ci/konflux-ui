import { renderHook, act } from '@testing-library/react';
import { mockAnalyticsServiceFn } from '~/unit-test-utils';
import { SHA256Hash, TrackEvents } from '../gen/analytics-types';
import { useTrackAnalyticsEvent } from '../hooks';

jest.mock('../conditional-checks', () => ({
  useIsAnalyticsEnabled: jest.fn(),
}));

const trackMock = mockAnalyticsServiceFn('track');

const { useIsAnalyticsEnabled }: { useIsAnalyticsEnabled: jest.Mock } =
  jest.requireMock('../conditional-checks');

describe('useTrackAnalyticsEvent', () => {
  const FAKE_HASH = 'abc123' as SHA256Hash;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call track when analytics is enabled', () => {
    useIsAnalyticsEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useTrackAnalyticsEvent());

    act(() => {
      result.current(TrackEvents.user_login_event, { userId: FAKE_HASH });
    });

    expect(trackMock).toHaveBeenCalledWith(TrackEvents.user_login_event, {
      userId: FAKE_HASH,
    });
  });

  it('should not call track when analytics is disabled', () => {
    useIsAnalyticsEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useTrackAnalyticsEvent());

    act(() => {
      result.current(TrackEvents.user_login_event, { userId: FAKE_HASH });
    });

    expect(trackMock).not.toHaveBeenCalled();
  });

  it('should return a stable reference when enabled state does not change', () => {
    useIsAnalyticsEnabled.mockReturnValue(true);

    const { result, rerender } = renderHook(() => useTrackAnalyticsEvent());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
