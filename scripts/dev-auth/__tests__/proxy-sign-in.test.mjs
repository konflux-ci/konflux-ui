import assert from 'node:assert/strict';
import test from 'node:test';
import { createDevAuthProxy } from '#dev-auth/proxy.mjs';
import { credentials, deferred, localProxy, request, upstream } from './proxy-test-utils.mjs';

test('requires same-origin Referer for sign-in and sign-out', async (t) => {
  const { port, tokenManager } = await localProxy(t, createDevAuthProxy);
  for (const path of ['/oauth2/start', '/oauth2/sign_in', '/oauth2/sign_out']) {
    for (const referer of ['', 'https://evil.example/path', 'null', '//localhost:8080/path']) {
      assert.equal((await request(port, path, { headers: { referer } })).status, 403);
    }
  }
  assert.equal(tokenManager.calls.signIn, 0);
  assert.equal(tokenManager.calls.signOut, 0);
});

test('validates local return paths before login and redirects after login', async (t) => {
  const { port, tokenManager } = await localProxy(t, createDevAuthProxy);
  for (const rd of [
    'https://evil.example',
    '//evil.example',
    '/\\evil',
    '/a\nb',
    '\\evil',
    'relative',
    '/%5cevil',
    '/%0dtest',
  ]) {
    assert.equal((await request(port, `/oauth2/start?rd=${encodeURIComponent(rd)}`)).status, 400);
  }
  assert.equal(tokenManager.calls.signIn, 0);
  const result = await request(port, '/oauth2/sign_in?rd=%2Fns%2Fdemo%3Fx%3D1%23section');
  assert.equal(result.status, 302);
  assert.equal(result.headers.location, '/ns/demo?x=1#section');
  assert.equal(result.headers['cache-control'], 'no-store');
  assert.equal((await request(port, '/oauth2/start')).headers.location, '/');
});

test('never starts login for missing authentication and emits safe local errors', async (t) => {
  const tokenManager = credentials();
  tokenManager.getCredential = async () => {
    throw new Error('secret-id-token and internal command');
  };
  tokenManager.signIn = async () => {
    throw new Error('secret-id-token and internal command');
  };
  const { port, remote } = await localProxy(t, createDevAuthProxy, { tokenManager });
  for (const path of ['/api/k8s', '/oauth2/userinfo']) {
    const response = await request(port, path);
    assert.equal(response.status, 401);
    assert.doesNotMatch(response.body, /secret-id-token|internal command/);
  }
  assert.equal(tokenManager.calls.signIn, 0);
  const failedLogin = await request(port, '/oauth2/start');
  assert.equal(failedLogin.status, 503);
  assert.equal(failedLogin.headers['cache-control'], 'no-store');
  assert.match(failedLogin.body, /retry|try again/i);
  assert.doesNotMatch(failedLogin.body, /secret-id-token|internal command/);
  assert.equal(remote.requests.length, 0);
});

test('stops sign-in redirects on transient userinfo failure and recovers with the same credentials', async (t) => {
  let ready = false;
  const remote = await upstream(t, (_req, res) => {
    res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
    res.end(ready ? '{}' : 'secret-id-token internal error');
  });
  const { port, tokenManager } = await localProxy(t, createDevAuthProxy, { remote });
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await request(port, '/oauth2/start?rd=%2Fns%2Fdemo', {
      headers: { cookie: 'browser-session' },
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.location, undefined);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.match(response.body, /retry|try again/i);
    assert.doesNotMatch(response.body, /secret-id-token|internal error/);
  }
  assert.equal(tokenManager.calls.signOut, 0);
  ready = true;
  const recovered = await request(port, '/oauth2/start?rd=%2Fns%2Fdemo');
  assert.equal(recovered.status, 302);
  assert.equal(recovered.headers.location, '/ns/demo');
  assert.equal(remote.requests.length, 3);
  for (const received of remote.requests) {
    assert.equal(received.url, '/oauth2/userinfo');
    assert.equal(received.headers.authorization, 'Bearer secret-id-token');
    assert.equal(received.headers.cookie, undefined);
  }
});

test('discards rejected cached credentials before offering an explicit sign-in retry', async (t) => {
  let ready = false;
  const remote = await upstream(t, (_req, res) => {
    res.writeHead(ready ? 200 : 401);
    res.end('{}');
  });
  const { port, tokenManager } = await localProxy(t, createDevAuthProxy, { remote });
  const rejected = await request(port, '/oauth2/sign_in');
  assert.equal(rejected.status, 503);
  assert.equal(rejected.headers.location, undefined);
  assert.equal(tokenManager.calls.signOut, 1);
  ready = true;
  assert.equal((await request(port, '/oauth2/sign_in')).status, 302);
  assert.equal(tokenManager.calls.signOut, 1);
});

test('sign-in readiness checks reject invalid upstream TLS without redirecting', async (t) => {
  const { port, remote } = await localProxy(t, createDevAuthProxy, { ca: undefined });
  const response = await request(port, '/oauth2/start');
  assert.equal(response.status, 503);
  assert.equal(response.headers.location, undefined);
  assert.equal(remote.requests.length, 0);
});

test('sign-in readiness checks have a deadline and do not follow upstream redirects', async (t) => {
  let redirect = false;
  const remote = await upstream(t, (_req, res) => {
    if (redirect) {
      res.writeHead(302, { location: 'https://example.invalid/' });
      res.end();
    }
  });
  const { port } = await localProxy(t, createDevAuthProxy, { remote, probeTimeoutMs: 30 });
  assert.equal((await request(port, '/oauth2/start')).status, 503);
  redirect = true;
  assert.equal((await request(port, '/oauth2/start')).status, 503);
  assert.equal(remote.requests.length, 2);
});

test('logout cancels a pending readiness probe before a newer sign-in succeeds', async (t) => {
  const firstProbeStarted = deferred();
  const firstProbeClosed = deferred();
  let firstResponse;
  let count = 0;
  const remote = await upstream(t, (_req, res) => {
    if (++count === 1) {
      firstResponse = res;
      res.on('close', () => firstProbeClosed.resolve());
      firstProbeStarted.resolve();
    } else {
      res.writeHead(200);
      res.end('{}');
    }
  });
  const { port, tokenManager } = await localProxy(t, createDevAuthProxy, { remote });
  const firstSignIn = request(port, '/oauth2/sign_in');
  await firstProbeStarted.promise;
  assert.equal((await request(port, '/oauth2/sign_out')).status, 204);
  const closedBeforeDeadline = await Promise.race([
    firstProbeClosed.promise.then(() => true),
    new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 500);
      timer.unref();
    }),
  ]);
  assert.equal(closedBeforeDeadline, true, 'Logout must close the readiness request immediately.');
  assert.equal((await firstSignIn).status, 401);
  assert.equal((await request(port, '/oauth2/sign_in')).status, 302);
  // A stale remote denial must not invalidate the newer session.
  firstResponse.writeHead(401);
  firstResponse.end('{}');
  assert.equal(tokenManager.calls.signOut, 1);
  assert.equal((await request(port, '/api/k8s')).status, 200);
});

test('an old readiness denial cannot invalidate credentials refreshed during the probe', async (t) => {
  const started = deferred();
  let firstResponse;
  let count = 0;
  const remote = await upstream(t, (_req, res) => {
    if (++count === 1) {
      firstResponse = res;
      started.resolve();
    } else {
      res.writeHead(200);
      res.end('{}');
    }
  });
  let generation = 0;
  const tokenManager = credentials();
  tokenManager.signIn = async () => ({ token: 'secret-id-token', generation });
  tokenManager.isCurrent = (candidate) => candidate === generation;
  const { port } = await localProxy(t, createDevAuthProxy, { remote, tokenManager });
  const firstSignIn = request(port, '/oauth2/sign_in');
  await started.promise;
  generation++;
  firstResponse.writeHead(401);
  firstResponse.end('{}');
  assert.equal((await firstSignIn).status, 401);
  assert.equal(tokenManager.calls.signOut, 0);
  assert.equal((await request(port, '/oauth2/sign_in')).status, 302);
});

test('successful readiness accepts headers without buffering an endless userinfo body', async (t) => {
  const closed = deferred();
  const remote = await upstream(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.write('secret-user-data');
    res.once('close', () => closed.resolve());
  });
  const { port } = await localProxy(t, createDevAuthProxy, { remote, probeTimeoutMs: 100 });
  const response = await request(port, '/oauth2/sign_in');
  assert.equal(response.status, 302);
  assert.doesNotMatch(response.body, /secret-user-data/);
  await closed.promise;
});

test('close cancels an in-flight readiness request before its deadline', async (t) => {
  const started = deferred();
  const closed = deferred();
  const remote = await upstream(t, (_req, res) => {
    res.once('close', () => closed.resolve());
    started.resolve();
  });
  const { port, proxy } = await localProxy(t, createDevAuthProxy, { remote });
  const signIn = request(port, '/oauth2/sign_in');
  await started.promise;
  await proxy.close();
  const upstreamClosed = await Promise.race([
    closed.promise.then(() => true),
    new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 500);
      timer.unref();
    }),
  ]);
  assert.equal(upstreamClosed, true, 'Proxy close must close its readiness request immediately.');
  assert.equal((await signIn).status, 401);
});
