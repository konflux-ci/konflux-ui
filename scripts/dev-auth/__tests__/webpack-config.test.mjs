import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import createDevConfig from '#webpack-dev-config';

function fixture() {
  const calls = [];
  const authProxy = {
    middleware: () => {},
    handlesUpgrade: (req) => req.url.startsWith('/wss/k8s/'),
    upgrade: (...args) => {
      calls.push(args);
    },
    close: async () => calls.push('closed'),
  };
  const options = createDevConfig(authProxy).devServer;
  return { calls, authProxy, options };
}

test('development configuration uses local CLI authentication and retains the Lightspeed proxy', () => {
  const { options } = fixture();
  assert.equal(options.host, '127.0.0.1');
  assert.equal(options.port, 8080);
  assert.equal(options.server, 'https');
  assert.equal(options.proxy.length, 1);
  assert.deepEqual(options.proxy[0].context, ['/api/plugins/lightspeed']);
  assert.equal(options.setupExitSignals, false);
  assert.deepEqual(options.allowedHosts, ['localhost']);
  assert.equal(options.webSocketServer.options.path, '/ws');
  assert.equal(options.client.webSocketURL.hostname, 'localhost');
  assert.equal(options.client.webSocketURL.port, 8080);
});

test('authentication middleware precedes history and unrelated proxy middleware', () => {
  const { authProxy, options } = fixture();
  const original = [{ name: 'history-api-fallback', middleware: () => {} }];
  const ordered = options.setupMiddlewares(original, {});
  assert.equal(ordered[0].middleware, authProxy.middleware);
  assert.equal(ordered[1], original[0]);
  assert.equal(original.length, 1);
});

test('only API upgrades use authenticated dispatch and HMR remains with webpack', async () => {
  const { calls, options } = fixture();
  const server = new EventEmitter();
  options.onListening({ server });
  const socket = { destroy() {} };
  const head = Buffer.from('initial websocket bytes');
  const req = { url: '/wss/k8s/api/v1/pods?watch=true' };
  server.emit('upgrade', { url: '/ws' }, socket, head);
  assert.equal(calls.length, 0);
  server.emit('upgrade', req, socket, head);
  assert.deepEqual(calls, [[req, socket, head]]);
  server.emit('close');
  await Promise.resolve();
  assert.deepEqual(calls.at(-1), 'closed');
});

test('a rejected upgrade is contained and closes the socket', async () => {
  const { authProxy, options } = fixture();
  authProxy.upgrade = async () => {
    throw new Error('must not escape an event handler');
  };
  let destroyed = false;
  const server = new EventEmitter();
  options.onListening({ server });
  server.emit(
    'upgrade',
    { url: '/wss/k8s/watch' },
    { destroy: () => (destroyed = true) },
    Buffer.alloc(0),
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(destroyed, true);
});
