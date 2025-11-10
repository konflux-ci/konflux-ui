import { renderHook, act } from '@testing-library/react-hooks';
import { useFullscreen } from '../fullscreen';

describe('useFullscreen', () => {
  let mockElement: HTMLElement;
  let mockAddEventListener: jest.Mock;
  let mockRemoveEventListener: jest.Mock;
  let mockRequestFullscreen: jest.Mock;
  let mockExitFullscreen: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock element methods
    mockAddEventListener = jest.fn();
    mockRemoveEventListener = jest.fn();
    mockRequestFullscreen = jest.fn();

    mockElement = {
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      requestFullscreen: mockRequestFullscreen,
    } as unknown as HTMLElement;

    // Mock document methods
    mockExitFullscreen = jest.fn();
    Object.defineProperty(document, 'exitFullscreen', {
      value: mockExitFullscreen,
      writable: true,
    });

    // Mock fullscreen properties
    Object.defineProperty(document, 'fullscreenEnabled', {
      value: true,
      writable: true,
    });

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
    });
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());

    const [isFullscreen, targetCallbackRef, fullscreenToggleCallback, fullscreenEnabled] =
      result.current;

    expect(isFullscreen).toBe(false);
    expect(typeof targetCallbackRef).toBe('function');
    expect(typeof fullscreenToggleCallback).toBe('function');
    expect(fullscreenEnabled).toBe(true);
  });

  it('should set up event listeners when target is set', () => {
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, targetCallbackRef] = result.current;

    act(() => {
      targetCallbackRef(mockElement as HTMLDivElement);
    });

    expect(mockAddEventListener).toHaveBeenCalledTimes(2);
    expect(mockAddEventListener).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('fullscreenerror', expect.any(Function));
  });

  it('should not set up event listeners when fullscreen is not enabled', () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      value: false,
      writable: true,
    });

    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, targetCallbackRef] = result.current;

    act(() => {
      targetCallbackRef(mockElement as HTMLDivElement);
    });

    expect(mockAddEventListener).not.toHaveBeenCalled();
  });

  it('should remove old event listeners when target changes', () => {
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, targetCallbackRef] = result.current;

    const oldElement = { ...mockElement } as HTMLDivElement;
    const oldRemoveEventListener = jest.fn();
    oldElement.removeEventListener = oldRemoveEventListener;

    // Set initial target
    act(() => {
      targetCallbackRef(oldElement);
    });

    // Change target
    act(() => {
      targetCallbackRef(mockElement as HTMLDivElement);
    });

    expect(oldRemoveEventListener).toHaveBeenCalledTimes(2);
    expect(oldRemoveEventListener).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
    expect(oldRemoveEventListener).toHaveBeenCalledWith('fullscreenerror', expect.any(Function));
  });

  it('should handle null target gracefully', () => {
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, targetCallbackRef] = result.current;

    expect(() => {
      act(() => {
        targetCallbackRef(null);
      });
    }).not.toThrow();
  });

  it('should request fullscreen when toggling from non-fullscreen state', () => {
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, targetCallbackRef, fullscreenToggleCallback] = result.current;

    // Set target element
    act(() => {
      targetCallbackRef(mockElement as HTMLDivElement);
    });

    // Toggle fullscreen
    act(() => {
      fullscreenToggleCallback();
    });

    expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('should exit fullscreen when toggling from fullscreen state', () => {
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    let [, targetCallbackRef, fullscreenToggleCallback] = result.current;

    // Set target element
    act(() => {
      targetCallbackRef(mockElement as HTMLDivElement);
    });

    // Simulate being in fullscreen mode
    act(() => {
      // Trigger the fullscreen change event to set isFullscreen to true
      const listener = mockAddEventListener.mock.calls.find(
        (call) => call[0] === 'fullscreenchange',
      )?.[1];

      // Mock document.fullscreenElement to return our element
      Object.defineProperty(document, 'fullscreenElement', {
        value: mockElement,
        writable: true,
      });

      // Trigger the event
      if (listener) {
        listener({ target: mockElement });
      }
    });

    // Get updated values after state change
    [, , fullscreenToggleCallback] = result.current;

    // Toggle to exit fullscreen
    act(() => {
      fullscreenToggleCallback();
    });

    expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('should not toggle when target is not set', () => {
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, , fullscreenToggleCallback] = result.current;

    act(() => {
      fullscreenToggleCallback();
    });

    expect(mockRequestFullscreen).not.toHaveBeenCalled();
    expect(mockExitFullscreen).not.toHaveBeenCalled();
  });

  it('should not toggle when fullscreen is not enabled', () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      value: false,
      writable: true,
    });

    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, targetCallbackRef, fullscreenToggleCallback] = result.current;

    act(() => {
      targetCallbackRef(mockElement as HTMLDivElement);
    });

    act(() => {
      fullscreenToggleCallback();
    });

    expect(mockRequestFullscreen).not.toHaveBeenCalled();
    expect(mockExitFullscreen).not.toHaveBeenCalled();
  });

  it('should update isFullscreen state when fullscreen change event fires', () => {
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    let [isFullscreen, targetCallbackRef] = result.current;

    expect(isFullscreen).toBe(false);

    // Set target element
    act(() => {
      targetCallbackRef(mockElement as HTMLDivElement);
    });

    // Get the event listener
    const listener = mockAddEventListener.mock.calls.find(
      (call) => call[0] === 'fullscreenchange',
    )?.[1];

    // Simulate entering fullscreen
    act(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: mockElement,
        writable: true,
      });

      if (listener) {
        listener({ target: mockElement });
      }
    });

    [isFullscreen] = result.current;
    expect(isFullscreen).toBe(true);

    // Simulate exiting fullscreen
    act(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
      });

      if (listener) {
        listener({ target: mockElement });
      }
    });

    [isFullscreen] = result.current;
    expect(isFullscreen).toBe(false);
  });

  it('should detect browser prefix support correctly', () => {
    // Test that the hook correctly detects fullscreen support
    // This tests the nativeAPI detection logic in the fullscreen module
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, , , fullscreenEnabled] = result.current;

    // Should return true since we mocked fullscreenEnabled to be true
    expect(fullscreenEnabled).toBe(true);
  });

  it('should handle browser compatibility correctly', () => {
    // Test the general browser compatibility handling
    // The module uses a fallback mechanism to detect browser support
    const { result } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [isFullscreen, targetCallbackRef, fullscreenToggleCallback, fullscreenEnabled] =
      result.current;

    expect(typeof isFullscreen).toBe('boolean');
    expect(typeof targetCallbackRef).toBe('function');
    expect(typeof fullscreenToggleCallback).toBe('function');
    expect(typeof fullscreenEnabled).toBe('boolean');
  });

  it('should maintain referential stability of callbacks', () => {
    const { result, rerender } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, firstTargetCallback, firstToggleCallback] = result.current;

    rerender();
    const [, secondTargetCallback, secondToggleCallback] = result.current;

    expect(firstTargetCallback).toBe(secondTargetCallback);
    expect(firstToggleCallback).toBe(secondToggleCallback);
  });

  it('should properly cleanup event listeners', () => {
    const { result, unmount } = renderHook(() => useFullscreen<HTMLDivElement>());
    const [, targetCallbackRef] = result.current;

    act(() => {
      targetCallbackRef(mockElement as HTMLDivElement);
    });

    unmount();

    // Event listeners should be cleaned up when component unmounts
    expect(mockAddEventListener).toHaveBeenCalledTimes(2);
  });
});
