import { renderHook } from '@testing-library/react';
import { useLayoutResizeObserver } from '../useLayoutResizeObserver';

describe('useLayoutResizeObserver', () => {
  let observeMock: jest.Mock;
  let disconnectMock: jest.Mock;
  let capturedCallback: ResizeObserverCallback;
  let observerInstanceCount: number;

  beforeEach(() => {
    observeMock = jest.fn();
    disconnectMock = jest.fn();
    observerInstanceCount = 0;
    window.ResizeObserver = jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
      observerInstanceCount += 1;
      capturedCallback = callback;
      return {
        observe: observeMock,
        disconnect: disconnectMock,
        unobserve: jest.fn(),
      };
    });
  });

  it('should observe a single provided element', () => {
    const element = document.createElement('div');
    const callback = jest.fn();

    renderHook(() => useLayoutResizeObserver(callback, [element]));

    expect(observeMock).toHaveBeenCalledWith(element, undefined);
  });

  it('should observe multiple elements with a single observer instance', () => {
    const elementA = document.createElement('div');
    const elementB = document.createElement('div');
    const callback = jest.fn();

    renderHook(() => useLayoutResizeObserver(callback, [elementA, elementB]));

    expect(observerInstanceCount).toBe(1);
    expect(observeMock).toHaveBeenCalledTimes(2);
    expect(observeMock).toHaveBeenCalledWith(elementA, undefined);
    expect(observeMock).toHaveBeenCalledWith(elementB, undefined);
  });

  it('should skip null/undefined elements', () => {
    const element = document.createElement('div');
    const callback = jest.fn();

    renderHook(() => useLayoutResizeObserver(callback, [null, element, undefined]));

    expect(observeMock).toHaveBeenCalledTimes(1);
    expect(observeMock).toHaveBeenCalledWith(element, undefined);
  });

  it('should not call observe() when all elements are null/undefined, but still invoke callback once', () => {
    const callback = jest.fn();

    renderHook(() => useLayoutResizeObserver(callback, [null, undefined]));

    expect(observeMock).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should invoke the callback once synchronously on setup, before any resize occurs', () => {
    const element = document.createElement('div');
    const callback = jest.fn();

    renderHook(() => useLayoutResizeObserver(callback, [element]));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith([], expect.anything());
  });

  it('should pass observer options through to observe', () => {
    const element = document.createElement('div');
    const callback = jest.fn();
    const options: ResizeObserverOptions = { box: 'border-box' };

    renderHook(() => useLayoutResizeObserver(callback, [element], options));

    expect(observeMock).toHaveBeenCalledWith(element, options);
  });

  it('should invoke the callback when the observer fires', () => {
    const element = document.createElement('div');
    const callback = jest.fn();

    renderHook(() => useLayoutResizeObserver(callback, [element]));

    const entries = [{ target: element }] as unknown as ResizeObserverEntry[];
    capturedCallback(entries, {} as ResizeObserver);

    expect(callback).toHaveBeenCalledWith(entries, {});
  });

  it('should disconnect the observer on unmount', () => {
    const element = document.createElement('div');
    const callback = jest.fn();

    const { unmount } = renderHook(() => useLayoutResizeObserver(callback, [element]));
    unmount();

    expect(disconnectMock).toHaveBeenCalled();
  });

  it('should re-observe when an element changes', () => {
    const elementA = document.createElement('div');
    const elementB = document.createElement('div');
    const callback = jest.fn();

    const { rerender } = renderHook(
      ({ target }) => useLayoutResizeObserver(callback, [target]),
      { initialProps: { target: elementA } },
    );

    expect(observeMock).toHaveBeenCalledTimes(1);
    expect(disconnectMock).not.toHaveBeenCalled();

    rerender({ target: elementB });

    expect(disconnectMock).toHaveBeenCalledTimes(1);
    expect(observeMock).toHaveBeenCalledTimes(2);
    expect(observeMock).toHaveBeenLastCalledWith(elementB, undefined);
  });

  it('should not re-observe when a new array literal with the same elements is passed', () => {
    const element = document.createElement('div');
    const callback = jest.fn();

    const { rerender } = renderHook(() => useLayoutResizeObserver(callback, [element]));

    expect(observeMock).toHaveBeenCalledTimes(1);

    rerender();

    expect(observeMock).toHaveBeenCalledTimes(1);
    expect(disconnectMock).not.toHaveBeenCalled();
  });
});
