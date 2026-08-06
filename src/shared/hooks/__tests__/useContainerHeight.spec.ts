import { renderHook, act } from '@testing-library/react';
import { useContainerHeight } from '../useContainerHeight';

let resizeCallback: ResizeObserverCallback;
const observeMock = jest.fn();
const disconnectMock = jest.fn();

beforeEach(() => {
  global.ResizeObserver = jest.fn((cb) => {
    resizeCallback = cb;
    return { observe: observeMock, unobserve: jest.fn(), disconnect: disconnectMock };
  }) as unknown as typeof ResizeObserver;
});

afterEach(() => {
  observeMock.mockClear();
  disconnectMock.mockClear();
});

describe('useContainerHeight', () => {
  it('should return undefined height initially when no element is attached', () => {
    const { result } = renderHook(() => useContainerHeight());
    expect(result.current.viewerHeight).toBeUndefined();
    expect(result.current.containerRef).toBeDefined();
  });

  it('should measure height via ResizeObserver', () => {
    const { result } = renderHook(() => useContainerHeight());

    expect(observeMock).toHaveBeenCalled();

    act(() => {
      resizeCallback(
        [
          {
            contentRect: { height: 400 },
            target: { clientHeight: 400, getBoundingClientRect: () => ({ top: 0 }) },
          },
        ] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
    });

    expect(result.current.viewerHeight).toBe(400);
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useContainerHeight());

    act(() => {});
    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('should not set height when contentRect height is 0', () => {
    const { result } = renderHook(() => useContainerHeight());

    act(() => {
      resizeCallback(
        [
          {
            contentRect: { height: 0 },
            target: { clientHeight: 0, getBoundingClientRect: () => ({ top: 0 }) },
          },
        ] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
    });

    expect(result.current.viewerHeight).toBeUndefined();
  });

  it('should return stable reference when height has not changed', () => {
    const { result, rerender } = renderHook(() => useContainerHeight());

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first).toBe(second);
  });
});
