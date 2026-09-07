import { act, renderHook } from '@testing-library/react';
import { useCurrentTime } from '../useCurrentTime';

describe('useCurrentTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates the current time at the configured interval when enabled', () => {
    const initialTime = Date.now();
    const { result } = renderHook(() => useCurrentTime());

    expect(result.current).toBe(initialTime);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(initialTime + 1000);
  });

  it('does not start an interval when disabled', () => {
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');

    renderHook(() => useCurrentTime(false));

    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('cleans up the interval when disabled or unmounted', () => {
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    const { rerender, unmount } = renderHook(({ enabled }) => useCurrentTime(enabled), {
      initialProps: { enabled: true },
    });

    rerender({ enabled: false });
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });
});
