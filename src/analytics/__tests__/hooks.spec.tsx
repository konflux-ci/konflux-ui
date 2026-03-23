import { renderHook, act } from '@testing-library/react';
import { mockAnalyticsServiceFn } from '~/unit-test-utils';
import { SHA256Hash, TrackEvents } from '../gen/analytics-types';
import { useAnalyticsCommonProperties, useTrackAnalyticsEvent } from '../hooks';

jest.mock('../conditional-checks', () => ({
  useIsAnalyticsEnabled: jest.fn(),
}));

const setCommonPropertiesMock = mockAnalyticsServiceFn('setCommonProperties');
const trackMock = mockAnalyticsServiceFn('track');

const { useIsAnalyticsEnabled }: { useIsAnalyticsEnabled: jest.Mock } =
  jest.requireMock('../conditional-checks');

describe('useAnalyticsCommonProperties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call setCommonProperties when values are provided', () => {
    renderHook(() =>
      useAnalyticsCommonProperties({
        clusterVersion: '4.14',
        konfluxVersion: '1.0',
        kubernetesVersion: '1.30',
      }),
    );

    expect(setCommonPropertiesMock).toHaveBeenCalledWith({
      clusterVersion: '4.14',
      konfluxVersion: '1.0',
      kubernetesVersion: '1.30',
    });
  });

  it('should not call setCommonProperties when all values are falsy', () => {
    renderHook(() => useAnalyticsCommonProperties({}));
    expect(setCommonPropertiesMock).not.toHaveBeenCalled();
  });

  it('should update when properties change', () => {
    const { rerender } = renderHook(({ props }) => useAnalyticsCommonProperties(props), {
      initialProps: { props: { clusterVersion: '4.14' } },
    });

    expect(setCommonPropertiesMock).toHaveBeenCalledTimes(1);
    expect(setCommonPropertiesMock).toHaveBeenCalledWith({
      clusterVersion: '4.14',
    });

    rerender({ props: { clusterVersion: '4.15' } });

    expect(setCommonPropertiesMock).toHaveBeenCalledTimes(2);
    expect(setCommonPropertiesMock).toHaveBeenLastCalledWith({
      clusterVersion: '4.15',
    });
  });

  it('should not re-run effect when properties are the same', () => {
    const { rerender } = renderHook(({ props }) => useAnalyticsCommonProperties(props), {
      initialProps: { props: { clusterVersion: '4.14' } },
    });

    expect(setCommonPropertiesMock).toHaveBeenCalledTimes(1);

    rerender({ props: { clusterVersion: '4.14' } });

    expect(setCommonPropertiesMock).toHaveBeenCalledTimes(1);
  });
});

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
