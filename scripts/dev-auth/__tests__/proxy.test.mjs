import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { brotliCompressSync, brotliDecompressSync, gunzipSync, gzipSync } from 'node:zlib';
import { createDevAuthProxy, resolveTargets } from '#dev-auth/proxy.mjs';
import {
  canonicalHeaders,
  credentials,
  deferred,
  localProxy,
  request,
  upstream,
} from './proxy-test-utils.mjs';

const env = {
  AUTH_URL: 'https://cluster.example',
  PROXY_URL: 'https://cluster.example/',
  REGISTRATION_URL: 'https://cluster.example',
  PROXY_WEBSOCKET_URL: 'wss://cluster.example',
};

test('rejects mismatched, insecure, non-root, credentialed or missing trusted targets', () => {
  const targets = resolveTargets(env);
  assert.equal(targets.api.href, 'https://cluster.example/');
  assert.equal(targets.websocket.href, 'wss://cluster.example/');
  for (const bad of [
    undefined,
    '',
    'http://cluster.example',
    'https://other.example',
    'https://cluster.example:444',
    'https://cluster.example/api',
    'https://cluster.example?token=secret',
    'https://cluster.example/#x',
    'https://user:secret@cluster.example',
  ]) {
    assert.throws(() => resolveTargets({ ...env, PROXY_URL: bad }), /target|URL|configuration/i);
  }
  assert.throws(() => resolveTargets({ ...env, PROXY_WEBSOCKET_URL: 'https://cluster.example' }));
});

test('forwards API method, body and query while replacing browser identity', async (t) => {
  const { port } = await localProxy(t, createDevAuthProxy);
  const result = await request(port, '/api/k8s/apis/demo?watch=true&x=a%2Fb', {
    method: 'POST',
    body: '{"kind":"Test"}',
    headers: {
      authorization: 'Bearer browser-token',
      cookie: 'session=secret',
      forwarded: 'for=evil;host=evil',
      'x-remote-user': 'admin',
      'x-remote-group': 'admin',
      'remote-user': 'admin',
      'remote-group': 'admin',
      'x-forwarded-for': 'evil',
      'x-forwarded-host': 'evil',
      'x-auth-request-user': 'evil',
      'impersonate-user': 'admin',
      'impersonate-group': 'admin',
      'x-user': 'admin',
      'x-group': 'admin',
      'x-real-ip': 'evil',
      'content-type': 'application/json',
    },
  });
  assert.equal(result.status, 200);
  const received = JSON.parse(result.body);
  assert.equal(received.url, '/api/k8s/apis/demo?watch=true&x=a%2Fb');
  assert.equal(received.method, 'POST');
  assert.equal(received.body, '{"kind":"Test"}');
  assert.equal(received.headers.authorization, 'Bearer secret-id-token');
  for (const name of [
    'cookie',
    'forwarded',
    'x-remote-user',
    'x-remote-group',
    'remote-user',
    'remote-group',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-auth-request-user',
    'impersonate-user',
    'impersonate-group',
    'x-user',
    'x-group',
    'x-real-ip',
  ])
    assert.equal(received.headers[name], undefined);
});

test('routes userinfo and registration precisely and leaves unrelated paths untouched', async (t) => {
  const auth = await upstream(t);
  const api = await upstream(t);
  const registration = await upstream(t);
  const websocket = await upstream(t);
  const { port, proxy, tokenManager } = await localProxy(t, createDevAuthProxy, {
    targets: {
      auth: auth.url,
      api: api.url,
      registration: registration.url,
      websocket: new URL(websocket.url.href.replace('https:', 'wss:')),
    },
  });
  for (const path of [
    '/oauth2/userinfo',
    '/api/k8s/registration/v1',
    '/api/k8s/registrations',
    '/api/k8s',
  ]) {
    assert.equal((await request(port, path)).status, 200);
  }
  assert.deepEqual(
    auth.requests.map((r) => r.url),
    ['/oauth2/userinfo'],
  );
  assert.deepEqual(
    registration.requests.map((r) => r.url),
    ['/api/k8s/registration/v1'],
  );
  assert.deepEqual(
    api.requests.map((r) => r.url),
    ['/api/k8s/registrations', '/api/k8s'],
  );
  const previousCalls = tokenManager.calls.get;
  for (const path of [
    '/api/plugins/lightspeed',
    '/x/api/k8s',
    '/api/k8sevil',
    '/ws',
    '/anything/oauth2/start',
  ]) {
    assert.equal((await request(port, path)).status, 418);
    assert.equal(proxy.handlesUpgrade({ url: path }), false);
  }
  assert.equal(tokenManager.calls.get, previousCalls);
  assert.equal((await request(port, '/oauth2/callback')).status, 404);
});

test('denies invalid browser boundaries before obtaining credentials or contacting upstream', async (t) => {
  const { port, tokenManager, remote } = await localProxy(t, createDevAuthProxy);
  for (const headers of [
    { host: 'evil:8080' },
    { host: 'localhost:8081' },
    { host: '127.0.0.1:8080' },
    { origin: 'https://evil.example' },
    { origin: 'null' },
    { origin: 'https://localhost:8080/' },
    { origin: 'bad-url' },
    { origin: undefined, 'sec-fetch-site': undefined },
    { origin: undefined, 'sec-fetch-site': 'cross-site' },
    { origin: undefined, 'sec-fetch-site': 'same-site' },
  ]) {
    assert.equal((await request(port, '/api/k8s', { headers })).status, 403);
  }
  assert.equal(tokenManager.calls.get, 0);
  assert.equal(remote.requests.length, 0);
  assert.equal((await request(port, '/api/k8s', { headers: { origin: undefined } })).status, 200);
});

test('awaits concurrent pending credentials and rejects stale generations after logout', async (t) => {
  const tokenManager = credentials();
  const pending = deferred();
  const waiting = deferred();
  let count = 0;
  tokenManager.getCredential = () => {
    if (++count === 2) waiting.resolve();
    return pending.promise;
  };
  const { port, remote } = await localProxy(t, createDevAuthProxy, { tokenManager });
  const first = request(port, '/api/k8s/a');
  const second = request(port, '/api/k8s/b');
  await waiting.promise;
  assert.equal(remote.requests.length, 0);
  assert.equal((await request(port, '/oauth2/sign_out')).status, 204);
  pending.resolve({ token: 'secret-id-token', generation: 0 });
  assert.equal((await first).status, 401);
  assert.equal((await second).status, 401);
  assert.equal(remote.requests.length, 0);
});

test('forwards only after pending refresh completes successfully', async (t) => {
  const pending = deferred();
  const waiting = deferred();
  const tokenManager = credentials();
  tokenManager.getCredential = () => {
    waiting.resolve();
    return pending.promise;
  };
  const { port, remote } = await localProxy(t, createDevAuthProxy, { tokenManager });
  const response = request(port, '/api/k8s');
  await waiting.promise;
  assert.equal(remote.requests.length, 0);
  pending.resolve({ token: 'refreshed-id-token', generation: 0 });
  assert.equal((await response).status, 200);
  assert.equal(remote.requests[0].headers.authorization, 'Bearer refreshed-id-token');
});

test('maps non-success userinfo to 401 and never follows an upstream redirect', async (t) => {
  const remote = await upstream(t, (_req, res) => {
    res.writeHead(302, { location: 'https://example.invalid/token' });
    res.end('remote redirect');
  });
  const { port } = await localProxy(t, createDevAuthProxy, { remote });
  const info = await request(port, '/oauth2/userinfo');
  assert.equal(info.status, 401);
  assert.equal(info.headers.location, undefined);
  assert.doesNotMatch(info.body, /remote redirect/);
  assert.equal((await request(port, '/api/k8s')).status, 302);
  assert.equal(remote.requests.length, 2);
});

for (const [encoding, compress, decompress] of [
  [undefined, (body) => body, (body) => body],
  ['gzip', gzipSync, gunzipSync],
  ['br', brotliCompressSync, brotliDecompressSync],
]) {
  test(`decodes ${encoding ?? 'plain'} userinfo while retaining local response protections`, async (t) => {
    const userinfo = { sub: 'developer', name: 'Gal' };
    const remote = await upstream(t, (_req, res) => {
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=3600',
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
        ...(encoding ? { 'content-encoding': encoding } : {}),
      });
      res.end(compress(Buffer.from(JSON.stringify(userinfo))));
    });
    const { port } = await localProxy(t, createDevAuthProxy, { remote });
    const response = await new Promise((resolve, reject) => {
      http
        .get(
          {
            hostname: '127.0.0.1',
            port,
            path: '/oauth2/userinfo',
            headers: { ...canonicalHeaders, 'accept-encoding': encoding ?? 'identity' },
          },
          resolve,
        )
        .on('error', reject);
    });
    const chunks = [];
    for await (const chunk of response) chunks.push(chunk);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['content-encoding'], encoding);
    assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['access-control-allow-origin'], undefined);
    assert.equal(response.headers['access-control-allow-credentials'], undefined);
    assert.deepEqual(JSON.parse(decompress(Buffer.concat(chunks)).toString()), userinfo);
  });
}

test('rejects untrusted upstream TLS with safe gateway/auth errors', async (t) => {
  const { port, remote } = await localProxy(t, createDevAuthProxy, { ca: undefined });
  assert.equal((await request(port, '/api/k8s')).status, 502);
  assert.equal((await request(port, '/oauth2/userinfo')).status, 401);
  assert.equal(remote.requests.length, 0);
});

test('close invalidates pending authentication without contacting upstream and is idempotent', async (t) => {
  const pending = deferred();
  const waiting = deferred();
  const tokenManager = credentials();
  tokenManager.getCredential = () => {
    waiting.resolve();
    return pending.promise;
  };
  const { port, proxy, remote } = await localProxy(t, createDevAuthProxy, { tokenManager });
  const response = request(port, '/api/k8s');
  await waiting.promise;
  await Promise.all([proxy.close(), proxy.close()]);
  pending.resolve({ token: 'secret-id-token', generation: 0 });
  assert.equal((await response).status, 401);
  assert.equal(remote.requests.length, 0);
});

test('rejects empty query/fragment delimiters and ambiguous target spelling', () => {
  for (const value of [
    'https://cluster.example?',
    'https://cluster.example#',
    'https://cluster.example\\',
    'https://cluster.example/\n',
  ]) {
    assert.throws(() => resolveTargets({ ...env, PROXY_URL: value }), /configuration/i);
  }
});

test('does not expose permissive upstream CORS headers on authenticated local responses', async (t) => {
  const remote = await upstream(t, (_req, res) => {
    res.writeHead(200, {
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'Authorization',
      'content-type': 'application/json',
    });
    res.end('{}');
  });
  const { port } = await localProxy(t, createDevAuthProxy, { remote });
  const response = await request(port, '/api/k8s');
  assert.equal(response.status, 200);
  assert.equal(response.headers['access-control-allow-origin'], undefined);
  assert.equal(response.headers['access-control-allow-credentials'], undefined);
  assert.equal(response.headers['access-control-allow-headers'], undefined);
});
