import { renderHook, act } from '@testing-library/react';
import { useContainerHeight } from '../useContainerHeight';

describe('useContainerHeight', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should return undefined height initially when no element is attached', () => {
    const { result } = renderHook(() => useContainerHeight({ isFullscreen: false }));
    expect(result.current.viewerHeight).toBeUndefined();
    expect(result.current.containerRef.current).toBeNull();
  });

  it('should measure height when ref is attached to an element', () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'clientHeight', { value: 400 });

    const { result } = renderHook(() => useContainerHeight({ isFullscreen: false }));

    act(() => {
      Object.defineProperty(result.current.containerRef, 'current', {
        value: div,
        writable: true,
      });
    });

    const { rerender } = renderHook(() => useContainerHeight({ isFullscreen: false }));
    rerender();

    // Height is set on mount via immediate update
    // Since ref was attached after first render, we need a fresh mount
    const { result: result2 } = renderHook(() => {
      const hook = useContainerHeight({ isFullscreen: false });
      Object.defineProperty(hook.containerRef, 'current', {
        value: div,
        writable: true,
      });
      return hook;
    });

    // The effect runs after render, so we need to wait
    act(() => {});
    expect(result2.current.viewerHeight).toBe(400);
  });

  it('should register a resize event listener', () => {
    renderHook(() => useContainerHeight({ isFullscreen: false }));

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should remove resize listener on unmount', () => {
    const { unmount } = renderHook(() => useContainerHeight({ isFullscreen: false }));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should not set height when clientHeight is 0', () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'clientHeight', { value: 0 });

    const { result } = renderHook(() => {
      const hook = useContainerHeight({ isFullscreen: false });
      Object.defineProperty(hook.containerRef, 'current', {
        value: div,
        writable: true,
      });
      return hook;
    });

    act(() => {});
    expect(result.current.viewerHeight).toBeUndefined();
  });

  it('should return stable reference when height has not changed', () => {
    const { result, rerender } = renderHook(() => useContainerHeight({ isFullscreen: false }));

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first).toBe(second);
  });
});
