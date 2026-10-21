import { WebSocketFactory, WebSocketState } from '../WebSocketFactory';

type MockSocket = {
  onopen: (() => void) | null;
  onclose: ((evt: unknown) => void) | null;
  onerror: ((evt: unknown) => void) | null;
  onmessage: ((evt: unknown) => void) | null;
  close: jest.Mock;
  send: jest.Mock;
};

describe('WebSocketFactory reconnect', () => {
  const originalWebSocket = globalThis.WebSocket;
  let sockets: MockSocket[];

  beforeEach(() => {
    jest.useFakeTimers();
    sockets = [];
    jest.spyOn(console, 'info').mockImplementation(() => {});
    globalThis.WebSocket = jest.fn().mockImplementation(() => {
      const socket: MockSocket = {
        onopen: null,
        onclose: null,
        onerror: null,
        onmessage: null,
        close: jest.fn(),
        send: jest.fn(),
      };
      sockets.push(socket);
      return socket;
    }) as unknown as typeof WebSocket;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    globalThis.WebSocket = originalWebSocket;
  });

  const create = (options = {}) =>
    new WebSocketFactory('test', { host: 'localhost', path: '/ws', reconnect: true, ...options });

  it('reconnects after the socket closes', () => {
    const ws = create();
    expect(sockets).toHaveLength(1);

    sockets[0].onclose?.({});
    expect(sockets).toHaveLength(1);

    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);
    ws.destroy();
  });

  it('backs off between reconnect attempts instead of retrying immediately', () => {
    const ws = create();
    sockets[0].onclose?.({});

    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);

    // next attempt is scheduled 1500 ms later, not 0 ms
    jest.advanceTimersByTime(1499);
    expect(sockets).toHaveLength(2);
    jest.advanceTimersByTime(1);
    expect(sockets).toHaveLength(3);
    ws.destroy();
  });

  it('does not schedule a second reconnect while one is pending', () => {
    const ws = create();
    sockets[0].onclose?.({});
    sockets[0].onclose?.({});

    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);
    ws.destroy();
  });

  it('stops reconnecting once the socket opens', () => {
    const ws = create();
    sockets[0].onclose?.({});
    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(2);

    sockets[1].onopen?.();
    expect(ws.getState()).toBe(WebSocketState.OPENED);

    jest.advanceTimersByTime(60000);
    expect(sockets).toHaveLength(2);
    ws.destroy();
  });

  it('can reconnect again after a successful reconnect', () => {
    const ws = create();
    sockets[0].onclose?.({});
    jest.advanceTimersByTime(1000);
    sockets[1].onopen?.();

    sockets[1].onclose?.({});
    jest.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(3);
    ws.destroy();
  });

  it('does not reconnect when the reconnect option is off', () => {
    const ws = create({ reconnect: false });
    sockets[0].onclose?.({});
    jest.advanceTimersByTime(60000);
    expect(sockets).toHaveLength(1);
    ws.destroy();
  });

  it('destroys the socket after the configured timeout', () => {
    const ws = create({ timeout: 2000 });
    sockets[0].onclose?.({});
    jest.advanceTimersByTime(60000);
    expect(ws.getState()).toBe(WebSocketState.DESTROYED);
  });
});
