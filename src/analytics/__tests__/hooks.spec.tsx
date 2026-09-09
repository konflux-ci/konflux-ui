import { renderHook, act } from '@testing-library/react';
import { mockAnalyticsServiceFn } from '~/unit-test-utils';
import { TrackEvents } from '../gen/analytics-types';
import { useTrackAnalyticsEvent } from '../hooks';

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
