import { getWebsocketSubProtocolAndPathPrefix } from '../k8s-utils';

describe('getWebsocketSubProtocolAndPathPrefix', () => {
  it('should return correct path with leading slash, host, and subProtocols', () => {
    const path = '/example-path';
    const result = getWebsocketSubProtocolAndPathPrefix(path);

    expect(result).toEqual({
      path: '/wss/k8s/example-path',
      host: 'auto',
      subProtocols: ['base64.binary.k8s.io'],
    });
  });

  it('should set path to undefined if an empty string is provided', () => {
    const path = '';
    const result = getWebsocketSubProtocolAndPathPrefix(path);

    expect(result).toEqual({
      path: undefined,
      host: 'auto',
      subProtocols: ['base64.binary.k8s.io'],
    });
  });

  it('should add a leading slash to paths without one', () => {
    const path = 'no-leading-slash';
    const result = getWebsocketSubProtocolAndPathPrefix(path);

    expect(result).toEqual({
      path: '/wss/k8s/no-leading-slash',
      host: 'auto',
      subProtocols: ['base64.binary.k8s.io'],
    });
  });

  it('should not add an extra leading slash if the path already has one', () => {
    const path = '/already-has-slash';
    const result = getWebsocketSubProtocolAndPathPrefix(path);

    expect(result).toEqual({
      path: '/wss/k8s/already-has-slash',
      host: 'auto',
      subProtocols: ['base64.binary.k8s.io'],
    });
  });
});
