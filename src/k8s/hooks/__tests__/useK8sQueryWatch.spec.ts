import { renderHook, act } from '@testing-library/react-hooks';
import { K8sModelCommon } from '../../../types/k8s';
import { watchListResource, watchObjectResource } from '../../watch-utils';
import { WebSocketState } from '../../web-socket/WebSocketFactory';
import { useK8sQueryWatch } from '../useK8sQueryWatch';

jest.mock('../../watch-utils', () => ({
  watchListResource: jest.fn(),
  watchObjectResource: jest.fn(),
}));

const WEBSOCKET_RETRY_COUNT = 3;
const WEBSOCKET_RETRY_DELAY = 2000;

describe('useK8sQueryWatch', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear the WS Map
    (global as unknown as { WS: unknown }).WS = new Map();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockWebSocket = (state = WebSocketState.OPENED) => ({
    destroy: jest.fn(),
    onClose: jest.fn(),
    onError: jest.fn(),
    getState: jest.fn().mockReturnValue(state),
  });

  const mockWebSocket = createMockWebSocket();

  const mockResourceInit = {
    model: { kind: 'Test', apiGroup: 'test.group', apiVersion: 'v1' } as K8sModelCommon,
    queryOptions: {},
  };

  const mockOptions = { wsPrefix: '/test' };
  const mockHashedKey = 'test-key';

  it('should initialize websocket for list resource', () => {
    (watchListResource as jest.Mock).mockReturnValue(mockWebSocket);

    renderHook(() => useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions));

    expect(watchListResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(watchObjectResource).not.toHaveBeenCalled();
  });

  it('should initialize websocket for single resource', () => {
    (watchObjectResource as jest.Mock).mockReturnValue(mockWebSocket);

    renderHook(() => useK8sQueryWatch(mockResourceInit, false, mockHashedKey, mockOptions));

    expect(watchObjectResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(watchListResource).not.toHaveBeenCalled();
  });

  it('should not initialize websocket when resourceInit is null', () => {
    renderHook(() => useK8sQueryWatch(null, true, mockHashedKey, mockOptions));

    expect(watchListResource).not.toHaveBeenCalled();
    expect(watchObjectResource).not.toHaveBeenCalled();
  });

  it('should clean up websocket on unmount', () => {
    (watchListResource as jest.Mock).mockReturnValue(mockWebSocket);

    const { unmount } = renderHook(() =>
      useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions),
    );

    unmount();

    expect(mockWebSocket.destroy).toHaveBeenCalled();
  });

  it('should handle websocket close with code 1006 and attempt reconnection', () => {
    jest.useFakeTimers();
    let closeHandler: (event: { code: number }) => void;

    mockWebSocket.onClose.mockImplementation((handler) => {
      closeHandler = handler;
    });

    (watchListResource as jest.Mock).mockReturnValue(mockWebSocket);

    renderHook(() => useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions));

    mockWebSocket.getState.mockReturnValue(WebSocketState.CLOSED);

    // Simulate websocket close with code 1006
    act(() => {
      closeHandler({ code: 1006 });
    });

    // First retry
    act(() => {
      jest.advanceTimersByTime(WEBSOCKET_RETRY_DELAY);
    });

    expect(watchListResource).toHaveBeenCalledTimes(2);
  });

  it('should handle websocket close with code 1000 and attempt reconnection', () => {
    jest.useFakeTimers();
    let closeHandler: (event: { code: number }) => void;

    mockWebSocket.onClose.mockImplementation((handler) => {
      closeHandler = handler;
    });

    (watchListResource as jest.Mock).mockReturnValue(mockWebSocket);

    renderHook(() => useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions));

    mockWebSocket.getState.mockReturnValue(WebSocketState.CLOSED);

    // Simulate websocket close with code 1000 (normal closure from server)
    act(() => {
      closeHandler({ code: 1000 });
    });

    // First retry
    act(() => {
      jest.advanceTimersByTime(WEBSOCKET_RETRY_DELAY);
    });

    expect(watchListResource).toHaveBeenCalledTimes(2);
  });

  it('should skip reconnection if WebSocketFactory already reconnected', () => {
    jest.useFakeTimers();
    let closeHandler: (event: { code: number }) => void;

    mockWebSocket.onClose.mockImplementation((handler) => {
      closeHandler = handler;
    });

    (watchListResource as jest.Mock).mockReturnValue(mockWebSocket);

    renderHook(() => useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions));

    // WebSocket reports as OPENED (factory reconnected on its own)
    mockWebSocket.getState.mockReturnValue(WebSocketState.OPENED);

    // Simulate websocket close
    act(() => {
      closeHandler({ code: 1006 });
    });

    // Advance past retry delay — factory already reconnected
    act(() => {
      jest.advanceTimersByTime(WEBSOCKET_RETRY_DELAY);
    });

    // startWatch should NOT have been called again since factory reconnected
    expect(watchListResource).toHaveBeenCalledTimes(1);
  });

  it('should set error state after max retry attempts', () => {
    jest.useFakeTimers();
    let closeHandler: (event: { code: number }) => void;

    mockWebSocket.onClose.mockImplementation((handler) => {
      closeHandler = handler;
    });

    (watchListResource as jest.Mock).mockReturnValue(mockWebSocket);

    const { result } = renderHook(() =>
      useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions),
    );

    mockWebSocket.getState.mockReturnValue(WebSocketState.CLOSED);

    // Simulate multiple websocket closes
    for (let i = 0; i <= WEBSOCKET_RETRY_COUNT; i++) {
      act(() => {
        closeHandler({ code: 1006 });
        // Advance time by retry delay with exponential backoff
        jest.advanceTimersByTime(WEBSOCKET_RETRY_DELAY * Math.pow(2, i));
      });
    }

    expect(result.current).toEqual({
      code: 1006,
      message: 'WebSocket connection failed after multiple attempts',
    });
  });

  it('should handle websocket errors', () => {
    let errorHandler: (error: { code: number; message: string }) => void;

    mockWebSocket.onError.mockImplementation((handler) => {
      errorHandler = handler;
    });

    (watchListResource as jest.Mock).mockReturnValue(mockWebSocket);

    const { result } = renderHook(() =>
      useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions),
    );

    const mockError = { code: 1011, message: 'Test error' };

    act(() => {
      errorHandler(mockError);
    });

    expect(result.current).toEqual(mockError);
  });

  it('should clear error state and retry count on new resourceInit', () => {
    (watchListResource as jest.Mock).mockReturnValue(mockWebSocket);

    const { rerender, result } = renderHook(
      ({ resourceInit }) => useK8sQueryWatch(resourceInit, true, mockHashedKey, mockOptions),
      { initialProps: { resourceInit: mockResourceInit } },
    );

    // Set error state
    act(() => {
      mockWebSocket.onError.mock.calls[0][0]({ code: 1011, message: 'Test error' });
    });

    expect(result.current).toBeTruthy();

    // Rerender with new resourceInit
    rerender({
      resourceInit: {
        ...mockResourceInit,
        model: { kind: 'TestNew', apiGroup: 'test.group', apiVersion: 'v1' } as K8sModelCommon,
      },
    });

    expect(result.current).toBeNull();
  });

  describe('visibilitychange handler', () => {
    it('should restart watch when tab becomes visible and websocket is not connected', () => {
      const closedMockWs = createMockWebSocket(WebSocketState.CLOSED);
      (watchListResource as jest.Mock).mockReturnValue(closedMockWs);

      renderHook(() => useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions));

      expect(watchListResource).toHaveBeenCalledTimes(1);

      closedMockWs.getState.mockReturnValue(WebSocketState.CLOSED);

      // Simulate tab becoming visible
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(watchListResource).toHaveBeenCalledTimes(2);
    });

    it('should not restart watch when tab becomes visible and websocket is still open', () => {
      const openMockWs = createMockWebSocket(WebSocketState.OPENED);
      (watchListResource as jest.Mock).mockReturnValue(openMockWs);

      renderHook(() => useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions));

      expect(watchListResource).toHaveBeenCalledTimes(1);

      // Simulate tab becoming visible while websocket is still open
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Should not restart since connection is still open
      expect(watchListResource).toHaveBeenCalledTimes(1);
    });

    it('should not restart watch when tab becomes hidden', () => {
      const openMockWs = createMockWebSocket(WebSocketState.OPENED);
      (watchListResource as jest.Mock).mockReturnValue(openMockWs);

      renderHook(() => useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions));

      expect(watchListResource).toHaveBeenCalledTimes(1);

      // Simulate tab becoming hidden
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(watchListResource).toHaveBeenCalledTimes(1);
    });

    it('should clear wsError when restarting watch on visibility change', () => {
      const closedMockWs = createMockWebSocket(WebSocketState.OPENED);
      let errorHandler: (error: { code: number; message: string }) => void;

      closedMockWs.onError.mockImplementation((handler) => {
        errorHandler = handler;
      });

      (watchListResource as jest.Mock).mockReturnValue(closedMockWs);

      const { result } = renderHook(() =>
        useK8sQueryWatch(mockResourceInit, true, mockHashedKey, mockOptions),
      );

      // Set error state
      act(() => {
        errorHandler({ code: 1006, message: 'Connection lost' });
      });

      expect(result.current).toBeTruthy();

      closedMockWs.getState.mockReturnValue(WebSocketState.CLOSED);

      // Simulate tab becoming visible
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(result.current).toBeNull();
    });

    it('should not restart watch on visibility change when resourceInit is null', () => {
      (watchListResource as jest.Mock).mockReturnValue(mockWebSocket);

      renderHook(() => useK8sQueryWatch(null, true, mockHashedKey, mockOptions));

      // Simulate tab becoming visible
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(watchListResource).not.toHaveBeenCalled();
    });
  });
});
