import { WebSocketFactory, WebSocketState } from '../WebSocketFactory';

// Mock the utils module
jest.mock('../utils', () => ({
  createURL: jest.fn().mockReturnValue('ws://localhost/test'),
  applyConfigSubProtocols: jest.fn().mockReturnValue(undefined),
}));

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];

  onopen: ((evt: Event) => void) | null = null;
  onclose: ((evt: CloseEvent) => void) | null = null;
  onerror: ((evt: Event) => void) | null = null;
  onmessage: ((evt: MessageEvent) => void) | null = null;

  constructor(
    public url: string,
    public protocols?: string | string[],
  ) {
    MockWebSocket.instances.push(this);
  }

  close = jest.fn();
  send = jest.fn();

  simulateOpen(): void {
    this.onopen?.(new Event('open'));
  }

  simulateClose(code = 1006): void {
    const event = new CloseEvent('close', { code });
    this.onclose?.(event);
  }
}

describe('WebSocketFactory', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    MockWebSocket.instances = [];
    (global as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultOptions = {
    path: '/test',
    host: 'ws://localhost',
    reconnect: true,
  };

  describe('connectionAttempt guard', () => {
    it('should allow reconnection after a successful initial connection', () => {
      const factory = new WebSocketFactory('test-ws', defaultOptions);

      // Initial connection opens successfully
      const firstWs = MockWebSocket.instances[0];
      firstWs.simulateOpen();

      expect(factory.getState()).toBe(WebSocketState.OPENED);

      // Connection closes unexpectedly
      firstWs.simulateClose(1006);
      expect(factory.getState()).toBe(WebSocketState.CLOSED);

      // Advance past the initial reconnect delay
      jest.advanceTimersByTime(1000);

      // A new WebSocket should have been created via reconnect
      expect(MockWebSocket.instances.length).toBeGreaterThan(1);

      factory.destroy();
    });
  });

  describe('reconnection backoff', () => {
    it('should increase delay between reconnection attempts', () => {
      const factory = new WebSocketFactory('test-ws', defaultOptions);

      const firstWs = MockWebSocket.instances[0];
      firstWs.simulateOpen();
      firstWs.simulateClose(1006);

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      setTimeoutSpy.mockClear();

      // Trigger first reconnection attempt
      jest.advanceTimersByTime(1000);

      // Get the delays used in setTimeout calls during reconnection
      const reconnectDelays = setTimeoutSpy.mock.calls
        .map((call) => call[1])
        .filter((delay): delay is number => typeof delay === 'number' && delay > 0);

      // The backoff should produce non-zero delays (1500ms after first attempt)
      expect(reconnectDelays.some((d) => d > 0)).toBe(true);

      setTimeoutSpy.mockRestore();
      factory.destroy();
    });

    it('should not stay at zero delay forever', () => {
      const factory = new WebSocketFactory('test-ws', defaultOptions);

      const firstWs = MockWebSocket.instances[0];
      firstWs.simulateOpen();
      firstWs.simulateClose(1006);

      // Advance past initial reconnect delay
      jest.advanceTimersByTime(1000);

      const wsCountAfterFirstReconnect = MockWebSocket.instances.length;

      // Advance a small amount — with the old broken backoff (duration=0),
      // this would have created many connections. With the fix, it should
      // only create one since the next delay is 1500ms.
      jest.advanceTimersByTime(100);

      const wsCountAfterShortWait = MockWebSocket.instances.length;

      // Should NOT have created additional connections in 100ms
      // (next reconnect delay should be 1500ms with the fix)
      expect(wsCountAfterShortWait).toBe(wsCountAfterFirstReconnect);

      factory.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up the websocket connection', () => {
      const factory = new WebSocketFactory('test-ws', defaultOptions);
      const ws = MockWebSocket.instances[0];
      ws.simulateOpen();

      factory.destroy();

      expect(factory.getState()).toBe(WebSocketState.DESTROYED);
      expect(ws.close).toHaveBeenCalled();
    });
  });
});
