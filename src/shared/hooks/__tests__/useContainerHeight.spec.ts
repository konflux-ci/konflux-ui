import { renderHook, act } from '@testing-library/react';
import { useContainerHeight } from '../useContainerHeight';

const observeMock = jest.fn();
const disconnectMock = jest.fn();

beforeEach(() => {
  global.ResizeObserver = jest.fn((cb) => ({
    observe: observeMock.mockImplementation(() => cb([], {} as ResizeObserver)),
    unobserve: jest.fn(),
    disconnect: disconnectMock,
  })) as unknown as typeof ResizeObserver;
});

afterEach(() => {
  observeMock.mockClear();
  disconnectMock.mockClear();
});

describe('useContainerHeight', () => {
  it('should return undefined height initially when no element is attached', () => {
    const { result } = renderHook(() => useContainerHeight());
    expect(result.current.containerHeight).toBeUndefined();
    expect(result.current.containerRef).toBeDefined();
  });

  it('should not observe when container is null', () => {
    renderHook(() => useContainerHeight());
    expect(observeMock).not.toHaveBeenCalled();
  });

  it('should measure height when container is attached via ref callback', () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'clientHeight', { value: 400 });

    const { result } = renderHook(() => useContainerHeight());

    act(() => {
      result.current.containerRef(div);
    });

    expect(result.current.containerHeight).toBe(400);
  });

  it('should not set height when clientHeight is 0', () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'clientHeight', { value: 0 });

    const { result } = renderHook(() => useContainerHeight());

    act(() => {
      result.current.containerRef(div);
    });

    expect(result.current.containerHeight).toBeUndefined();
  });

  it('should disconnect observer on unmount', () => {
    const div = document.createElement('div');
    Object.defineProperty(div, 'clientHeight', { value: 400 });

    const { result, unmount } = renderHook(() => useContainerHeight());

    act(() => {
      result.current.containerRef(div);
    });

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('should return stable reference when height has not changed', () => {
    const { result, rerender } = renderHook(() => useContainerHeight());

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first).toBe(second);
  });
});
