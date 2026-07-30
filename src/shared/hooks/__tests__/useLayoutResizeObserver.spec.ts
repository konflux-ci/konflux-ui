import { renderHook } from '@testing-library/react';
import { useLayoutResizeObserver } from '../useLayoutResizeObserver';

describe('useLayoutResizeObserver', () => {
  let observeMock: jest.Mock;
  let disconnectMock: jest.Mock;
  let capturedCallback: ResizeObserverCallback;

  beforeEach(() => {
    observeMock = jest.fn();
    disconnectMock = jest.fn();
    window.ResizeObserver = jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
      capturedCallback = callback;
      return {
        observe: observeMock,
        disconnect: disconnectMock,
        unobserve: jest.fn(),
      };
    });
  });

  it('should observe the provided target element', () => {
    const element = document.createElement('div');
    const callback = jest.fn();

    renderHook(() => useLayoutResizeObserver(callback, element));

    expect(observeMock).toHaveBeenCalledWith(element, undefined);
  });

  it('should pass observer options through to observe', () => {
    const element = document.createElement('div');
    const callback = jest.fn();
    const options: ResizeObserverOptions = { box: 'border-box' };

    renderHook(() => useLayoutResizeObserver(callback, element, options));

    expect(observeMock).toHaveBeenCalledWith(element, options);
  });

  it('should invoke the callback when the observer fires', () => {
    const element = document.createElement('div');
    const callback = jest.fn();

    renderHook(() => useLayoutResizeObserver(callback, element));

    const entries = [{ target: element }] as unknown as ResizeObserverEntry[];
    capturedCallback(entries, {} as ResizeObserver);

    expect(callback).toHaveBeenCalledWith(entries, {});
  });

  it('should disconnect the observer on unmount', () => {
    const element = document.createElement('div');
    const callback = jest.fn();

    const { unmount } = renderHook(() => useLayoutResizeObserver(callback, element));
    unmount();

    expect(disconnectMock).toHaveBeenCalled();
  });

  it('should re-observe when the target element changes', () => {
    const elementA = document.createElement('div');
    const elementB = document.createElement('div');
    const callback = jest.fn();

    const { rerender } = renderHook(({ target }) => useLayoutResizeObserver(callback, target), {
      initialProps: { target: elementA },
    });

    expect(observeMock).toHaveBeenCalledTimes(1);
    expect(disconnectMock).not.toHaveBeenCalled();

    rerender({ target: elementB });

    expect(disconnectMock).toHaveBeenCalledTimes(1);
    expect(observeMock).toHaveBeenCalledTimes(2);
    expect(observeMock).toHaveBeenLastCalledWith(elementB, undefined);
  });
});
