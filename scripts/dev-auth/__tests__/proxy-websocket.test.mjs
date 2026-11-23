import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createDevAuthProxy } from '#dev-auth/proxy.mjs';
import {
  connect,
  credentials,
  deferred,
  localProxy,
  rejectedUpgrade,
  request,
  upstream,
} from './proxy-test-utils.mjs';

test('supports authenticated websocket subprotocols and precise API/registration websocket routes', async (t) => {
  const api = await upstream(t);
  const registration = await upstream(t);
  const websocket = await upstream(t);
  const { port } = await localProxy(t, createDevAuthProxy, {
    targets: {
      auth: api.url,
      api: api.url,
      registration: registration.url,
      websocket: new URL(websocket.url.href.replace('https:', 'wss:')),
    },
  });
  for (const path of ['/wss/k8s/watch?x=1', '/api/k8s/watch', '/api/k8s/registration/watch']) {
    const ws = connect(port, path, {
      authorization: 'browser',
      cookie: 'secret',
      'impersonate-user': 'admin',
    });
    await once(ws, 'open');
    assert.equal(ws.protocol, 'v4.channel.k8s.io');
    ws.send('hello');
    assert.equal((await once(ws, 'message'))[0].toString(), 'hello');
    ws.close();
    await once(ws, 'close');
  }
  assert.equal(websocket.requests[0].url, '/wss/k8s/watch?x=1');
  assert.equal(api.requests[0].url, '/api/k8s/watch');
  assert.equal(registration.requests[0].url, '/api/k8s/registration/watch');
  assert.equal(websocket.requests[0].headers.authorization, 'Bearer secret-id-token');
  assert.equal(websocket.requests[0].headers.cookie, undefined);
  assert.equal(websocket.requests[0].headers['impersonate-user'], undefined);
});

test('denies websocket boundary violations and leaves HMR upgrades alone', async (t) => {
  const { port, tokenManager, remote } = await localProxy(t, createDevAuthProxy);
  for (const headers of [
    { host: 'evil:8080' },
    { host: 'localhost:8081' },
    { origin: '' },
    { origin: 'null' },
    { origin: 'https://evil.example' },
  ]) {
    assert.equal(await rejectedUpgrade(port, '/wss/k8s', headers), 403);
  }
  assert.equal(await rejectedUpgrade(port, '/ws', {}), 418);
  assert.equal(tokenManager.calls.get, 0);
  assert.equal(remote.requests.length, 0);
});

test('logout closes authenticated websockets and allows a later sign-in', async (t) => {
  const { port } = await localProxy(t, createDevAuthProxy);
  const ws = connect(port, '/wss/k8s');
  await once(ws, 'open');
  const closed = once(ws, 'close');
  assert.equal((await request(port, '/oauth2/sign_out')).status, 204);
  await closed;
  assert.equal((await request(port, '/oauth2/start')).status, 302);
  assert.equal((await request(port, '/api/k8s')).status, 200);
});

test('logout closes an authenticated HTTP watch at both ends', async (t) => {
  const http = await import('node:http');
  const remoteStreamClosed = deferred();
  const remote = await upstream(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.write('event\n');
    res.on('close', () => remoteStreamClosed.resolve());
  });
  const { port } = await localProxy(t, createDevAuthProxy, { remote });
  const client = http.get({
    hostname: '127.0.0.1',
    port,
    path: '/api/k8s/watch',
    headers: {
      host: 'localhost:8080',
      origin: 'https://localhost:8080',
    },
  });
  const [response] = await once(client, 'response');
  response.on('error', () => {});
  await once(response, 'data');
  const clientClosed = new Promise((resolve) => response.once('close', resolve));
  assert.equal((await request(port, '/oauth2/sign_out')).status, 204);
  await Promise.all([clientClosed, remoteStreamClosed.promise]);
});

test('logout cancels pending websocket authentication before opening upstream', async (t) => {
  const pending = deferred();
  const waiting = deferred();
  const tokenManager = credentials();
  tokenManager.getCredential = () => {
    waiting.resolve();
    return pending.promise;
  };
  const { port, remote } = await localProxy(t, createDevAuthProxy, { tokenManager });
  const denied = rejectedUpgrade(port, '/wss/k8s', {});
  await waiting.promise;
  assert.equal((await request(port, '/oauth2/sign_out')).status, 204);
  pending.resolve({ token: 'secret-id-token', generation: 0 });
  assert.equal(await denied, 401);
  assert.equal(remote.connections.length, 0);
  assert.equal(remote.requests.length, 0);
});

test('refresh failure denies websocket requests without leaking errors or starting login', async (t) => {
  const tokenManager = credentials();
  tokenManager.getCredential = async () => {
    throw new Error('secret-id-token');
  };
  const { port, remote } = await localProxy(t, createDevAuthProxy, { tokenManager });
  assert.equal(await rejectedUpgrade(port, '/api/k8s', {}), 401);
  assert.equal(remote.requests.length, 0);
  assert.equal(tokenManager.calls.signIn, 0);
});

test('close immediately ends authenticated websocket streams', async (t) => {
  const { port, proxy } = await localProxy(t, createDevAuthProxy);
  const ws = connect(port, '/api/k8s');
  await once(ws, 'open');
  const clientClosed = once(ws, 'close');
  await proxy.close();
  await clientClosed;
});

test('rejects invalid TLS on websocket upstreams with a safe gateway response', async (t) => {
  const { port, remote } = await localProxy(t, createDevAuthProxy, { ca: undefined });
  assert.equal(await rejectedUpgrade(port, '/wss/k8s', {}), 502);
  assert.equal(remote.connections.length, 0);
  assert.equal(remote.requests.length, 0);
});

test('terminates the downstream HTTP watch when upstream aborts after a partial response', async (t) => {
  const http = await import('node:http');
  let remoteResponse;
  const remote = await upstream(t, (_req, res) => {
    remoteResponse = res;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.write('{"type":"ADDED"}\n');
  });
  const { port } = await localProxy(t, createDevAuthProxy, { remote });
  const client = http.get({
    hostname: '127.0.0.1',
    port,
    path: '/api/k8s/watch',
    headers: { host: 'localhost:8080', origin: 'https://localhost:8080' },
  });
  t.after(() => client.destroy());
  const [response] = await once(client, 'response');
  response.on('error', () => {});
  assert.equal(response.statusCode, 200);
  assert.equal((await once(response, 'data'))[0].toString(), '{"type":"ADDED"}\n');
  const downstreamClosed = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Downstream watch remained open after upstream abort.')),
      1000,
    );
    response.once('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  remoteResponse.destroy();
  await downstreamClosed;
});

test('logout closes the upstream HTTP watch even when the browser supplies Expect100', async (t) => {
  const http = await import('node:http');
  let remoteResponse;
  const remote = await upstream(t, (_req, res) => {
    remoteResponse = res;
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.write('event\n');
  });
  const { port } = await localProxy(t, createDevAuthProxy, { remote });
  const client = http.get({
    hostname: '127.0.0.1',
    port,
    path: '/api/k8s/watch',
    headers: { host: 'localhost:8080', origin: 'https://localhost:8080', expect: '100-continue' },
  });
  t.after(() => client.destroy());
  const [response] = await once(client, 'response');
  response.on('error', () => {});
  await once(response, 'data');
  const upstreamClosed = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Upstream Expect100 watch remained open after logout.')),
      1000,
    );
    remoteResponse.once('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  assert.equal((await request(port, '/oauth2/sign_out')).status, 204);
  await upstreamClosed;
  assert.equal(remote.requests[0].headers.expect, undefined);
});
