import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import https from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import WebSocket from 'ws';
import { createDevAuthProxy } from '#dev-auth/proxy.mjs';
import createDevConfig from '#webpack-dev-config';
import { canonicalHeaders, cert, credentials, deferred, upstream } from './proxy-test-utils.mjs';
import { key } from './test-certificate.mjs';

function request(port, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: '127.0.0.1',
        servername: 'localhost',
        port,
        path,
        ca: cert,
        ...options,
        headers: { ...canonicalHeaders, ...options.headers },
      },
      (res) => {
        const authorized = res.socket.authorized;
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('error', reject);
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString(),
            authorized,
          }),
        );
      },
    );
    req.on('error', reject);
    req.end(options.body);
  });
}

function connect(t, port, path, protocols = []) {
  const ws = new WebSocket(`wss://127.0.0.1:${port}${path}`, protocols, {
    servername: 'localhost',
    ca: cert,
    headers: canonicalHeaders,
  });
  t.after(() => ws.terminate());
  return ws;
}

test(
  'CLI authentication integrates with real HTTPS webpack-dev-server',
  { timeout: 30_000 },
  async (t) => {
    const remote = await upstream(t);
    const tokenManager = credentials();
    const authProxy = createDevAuthProxy({
      tokenManager,
      ca: cert,
      targets: {
        auth: remote.url,
        api: remote.url,
        registration: remote.url,
        websocket: new URL(remote.url.href.replace('https:', 'wss:')),
      },
    });
    const directory = await mkdtemp(join(tmpdir(), 'cli-auth-webpack-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const entry = join(directory, 'browser-entry.js');
    await writeFile(entry, "document.body.dataset.fixture = 'browser-fixture';\n");
    const compiler = webpack({
      mode: 'development',
      context: directory,
      entry,
      output: { path: join(directory, 'dist'), filename: 'browser.js', publicPath: '/' },
      devtool: false,
      stats: 'errors-only',
      infrastructureLogging: { level: 'none' },
      plugins: [
        new HtmlWebpackPlugin({
          templateContent: '<!doctype html><html><body>webpack SPA fixture</body></html>',
        }),
      ],
    });
    const compiled = deferred();
    compiler.hooks.done.tap('cli-auth-integration-test', compiled.resolve);
    compiler.hooks.failed.tap('cli-auth-integration-test', compiled.reject);
    const options = {
      ...createDevConfig(authProxy).devServer,
      server: { type: 'https', options: { key, cert } },
      static: false,
      client: { logging: 'none' },
      devMiddleware: { stats: 'errors-only' },
    };
    // Keep the helper's real canonical Host/Origin boundary while using an
    // ephemeral transport port, and never open a browser from this test.
    options.port = 0;
    options.open = false;
    const server = new WebpackDevServer(options, compiler);
    t.after(async () => {
      await authProxy.close();
      await server.stop();
    });
    await server.start();
    const stats = await compiled.promise;
    assert.equal(stats.hasErrors(), false, stats.toString({ all: false, errors: true }));
    const port = server.server.address().port;

    await t.test('API and authentication middleware run before SPA history fallback', async () => {
      const page = await request(port, '/ns/demo/applications', {
        headers: { accept: 'text/html' },
      });
      assert.equal(page.status, 200);
      assert.equal(page.authorized, true);
      assert.match(page.body, /webpack SPA fixture/);

      const callback = await request(port, '/oauth2/callback', {
        headers: { accept: 'text/html' },
      });
      assert.equal(callback.status, 404);
      assert.equal(callback.headers['cache-control'], 'no-store');
      assert.doesNotMatch(callback.body, /webpack SPA fixture/);
    });

    await t.test(
      'real HTTP proxy waits for credentials before forwarding a bearer token',
      async () => {
        const pending = deferred();
        const waiting = deferred();
        const getCredential = tokenManager.getCredential;
        tokenManager.getCredential = () => {
          tokenManager.calls.get++;
          waiting.resolve();
          return pending.promise;
        };
        try {
          const response = request(port, '/api/k8s/apis/demo?watch=true', {
            method: 'POST',
            body: '{"kind":"IntegrationFixture"}',
            headers: {
              accept: 'text/html',
              authorization: 'Bearer browser-credential',
              cookie: 'browser-session=untrusted',
              'content-type': 'application/json',
            },
          });
          await waiting.promise;
          assert.equal(remote.requests.length, 0);
          pending.resolve({ token: 'webpack-integration-cli-token', generation: 0 });
          const result = await response;
          assert.equal(result.status, 200);
          assert.match(result.headers['content-type'], /application\/json/);
          const received = JSON.parse(result.body);
          assert.equal(received.url, '/api/k8s/apis/demo?watch=true');
          assert.equal(received.method, 'POST');
          assert.equal(received.body, '{"kind":"IntegrationFixture"}');
          assert.equal(received.headers.authorization, 'Bearer webpack-integration-cli-token');
          assert.equal(received.headers.cookie, undefined);
        } finally {
          tokenManager.getCredential = getCredential;
        }
      },
    );

    await t.test(
      'API websocket upgrades reach the helper and preserve Kubernetes subprotocols',
      async (subtest) => {
        for (const path of ['/wss/k8s/watch?resourceVersion=7', '/api/k8s/watch']) {
          const ws = connect(subtest, port, path, ['v4.channel.k8s.io']);
          await once(ws, 'open');
          assert.equal(ws.protocol, 'v4.channel.k8s.io');
          const message = once(ws, 'message');
          ws.send('api-watch-message');
          assert.equal((await message)[0].toString(), 'api-watch-message');
          const received = remote.requests.at(-1);
          assert.equal(received.url, path);
          assert.equal(received.headers.authorization, 'Bearer secret-id-token');
          assert.equal(received.headers['sec-websocket-protocol'], 'v4.channel.k8s.io');
          const closed = once(ws, 'close');
          ws.close();
          await closed;
        }
      },
    );

    await t.test(
      'webpack HMR owns /ws without obtaining or attaching CLI credentials',
      async (subtest) => {
        const beforeCredentials = tokenManager.calls.get;
        const beforeUpstream = remote.requests.length;
        const connection = once(server.webSocketServer.implementation, 'connection');
        const ws = connect(subtest, port, '/ws');
        const hmrMessage = deferred();
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'hot') hmrMessage.resolve(message);
        });
        await once(ws, 'open');
        const [, upgradeRequest] = await connection;
        assert.equal(upgradeRequest.url, '/ws');
        assert.equal(upgradeRequest.headers.authorization, undefined);
        assert.equal(upgradeRequest.headers.cookie, undefined);
        assert.deepEqual(await hmrMessage.promise, { type: 'hot' });
        assert.equal(tokenManager.calls.get, beforeCredentials);
        assert.equal(remote.requests.length, beforeUpstream);
        const closed = once(ws, 'close');
        ws.close();
        await closed;
      },
    );

    await t.test(
      'compiled browser bundle contains HMR but no CLI helper or credential material',
      async () => {
        const bundle = await request(port, '/browser.js');
        assert.equal(bundle.status, 200);
        assert.match(bundle.body, /browser-fixture/);
        assert.match(bundle.body, /webpack-dev-server\/client/);
        assert.doesNotMatch(
          bundle.body,
          /webpack-integration-cli-token|secret-id-token|browser-credential|createDevAuthProxy|createDevConfig|kubelogin|node:child_process/,
        );
        const modules = stats.toJson({ all: false, modules: true }).modules;
        assert.equal(
          modules.some(({ name }) => /scripts\/dev-auth\//.test(name ?? '')),
          false,
        );
      },
    );
  },
);
