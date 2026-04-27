import { WebSocketFactory, WebSocketState } from '../WebSocketFactory';

// Mock WebSocket
class MockWebSocket {
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;

  close = jest.fn();
  send = jest.fn();
}

describe('WebSocketFactory', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    jest.useFakeTimers();
    mockWs = new MockWebSocket();
    jest.spyOn(globalThis, 'WebSocket').mockImplementation(() => mockWs as unknown as WebSocket);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const createFactory = (options = {}) =>
    new WebSocketFactory('test-ws', {
      path: '/test',
      host: 'ws://localhost',
      reconnect: true,
      ...options,
    });

  describe('reconnect', () => {
    it('should schedule a reconnection when the connection closes', () => {
      const setTimeoutSpy = jest.spyOn(window, 'setTimeout');
      const factory = createFactory();

      // Simulate connection open then close
      mockWs.onopen?.(new Event('open'));
      setTimeoutSpy.mockClear();

      mockWs.onclose?.(new CloseEvent('close'));

      // reconnect() should have called setTimeout to schedule a reconnection
      expect(setTimeoutSpy).toHaveBeenCalled();
    });

    it('should not schedule multiple reconnections simultaneously', () => {
      const setTimeoutSpy = jest.spyOn(window, 'setTimeout');
      const factory = createFactory();

      // Simulate close
      mockWs.onclose?.(new CloseEvent('close'));
      const callCountAfterFirstClose = setTimeoutSpy.mock.calls.length;

      // Simulate another close event — reconnect should bail out
      mockWs.onclose?.(new CloseEvent('close'));
      // No additional setTimeout should be scheduled
      expect(setTimeoutSpy.mock.calls.length).toBe(callCountAfterFirstClose);
    });

    it('should not reconnect when state is DESTROYED', () => {
      const setTimeoutSpy = jest.spyOn(window, 'setTimeout');
      const factory = createFactory();

      factory.destroy();
      setTimeoutSpy.mockClear();

      // Attempting to trigger reconnect on a destroyed socket should not schedule anything
      expect(factory.getState()).toBe(WebSocketState.DESTROYED);
    });

    it('should attempt to create a new WebSocket connection during reconnect', () => {
      const factory = createFactory();

      // Simulate close to trigger reconnect
      mockWs.onclose?.(new CloseEvent('close'));

      // Advance past the initial 1000ms reconnect delay
      jest.advanceTimersByTime(1000);

      // WebSocket constructor should have been called again (initial + reconnect)
      expect(globalThis.WebSocket).toHaveBeenCalledTimes(2);
    });
  });
});
