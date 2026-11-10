import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { createDevAuthProxy } from '#dev-auth/proxy.mjs';
import { AuthenticationRequiredError, createTokenManager } from '#dev-auth/token-manager.mjs';
import { connect, deferred, localProxy, rejectedUpgrade, request } from './proxy-test-utils.mjs';

const fixture = fileURLToPath(new URL('./fixtures/token-kubectl.mjs', import.meta.url));

async function waitForFile(path) {
  const deadline = Date.now() + 3000;
  while (
    !(await access(path).then(
      () => true,
      () => false,
    ))
  ) {
    assert.ok(Date.now() < deadline, 'controlled token subprocess did not become ready');
    await delay(5);
  }
}

// Breaks caught: HTTP and upgrades refreshing independently, forwarding stale tokens before
// refresh completes, or allowing a cancelled refresh to revive the session after logout.
test(
  'HTTP and WebSocket requests share real refresh and recover after logout cancels renewal',
  { timeout: 15_000 },
  async (t) => {
    const root = await mkdtemp(join(tmpdir(), 'dev-auth-flow-'));
    let now = Date.parse('2030-01-01T00:00:00Z');
    const calls = [];
    const responses = [
      ['initial-cli-token', '2030-01-01T00:05:00Z'],
      ['refreshed-cli-token', '2030-01-01T00:10:00Z'],
      ['cancelled-cli-token', '2030-01-01T00:15:00Z'],
      ['signed-in-again-cli-token', '2030-01-01T00:15:00Z'],
    ];
    const tokenManager = createTokenManager({
      issuerUrl: 'https://issuer.example/realms/test',
      logger: () => {},
      now: () => now,
      tmpRoot: root,
      spawnProcess: (_command, args, options) => {
        const index = calls.length;
        assert.ok(index < responses.length, 'unexpected extra login/refresh process');
        const [token, expirationTimestamp] = responses[index];
        const config = {
          recordPath: join(root, `record-${index}.json`),
          readyPath: join(root, `ready-${index}`),
          ...(index === 1 || index === 2 ? { releasePath: join(root, `release-${index}`) } : {}),
          stdout: JSON.stringify({
            apiVersion: 'client.authentication.k8s.io/v1',
            kind: 'ExecCredential',
            spec: {},
            status: { token, expirationTimestamp },
          }),
        };
        const child = spawn(process.execPath, [fixture, ...args], {
          ...options,
          env: { ...process.env, TOKEN_FIXTURE_CONFIG: JSON.stringify(config) },
        });
        calls.push({ args, child });
        return child;
      },
    });
    t.after(async () => {
      await tokenManager.close();
      await rm(root, { recursive: true, force: true });
    });

    // Observe arrival at the real manager without replacing its credential or refresh behavior.
    const getCredential = tokenManager.getCredential;
    let arrivals = 0;
    let waiting;
    tokenManager.getCredential = () => {
      const result = getCredential();
      if (arrivals > 0 && --arrivals === 0) waiting.resolve();
      return result;
    };
    function bothRequestsArrived() {
      arrivals = 2;
      waiting = deferred();
      return waiting.promise;
    }

    const { port, remote } = await localProxy(t, createDevAuthProxy, { tokenManager });
    const signedIn = await request(port, '/oauth2/start?rd=%2Fns%2Fdemo');
    assert.equal(signedIn.status, 302);
    assert.equal(signedIn.headers.location, '/ns/demo');
    assert.equal(calls.length, 1);
    assert.equal(remote.requests[0].url, '/oauth2/userinfo');
    assert.equal(remote.requests[0].headers.authorization, 'Bearer initial-cli-token');

    now = Date.parse('2030-01-01T00:04:00Z');
    const arrived = bothRequestsArrived();
    const pendingHttp = request(port, '/api/k8s/apis/demo?watch=true');
    const ws = connect(port, '/wss/k8s/exec?stdin=true', {}, ['v4.channel.k8s.io']);
    t.after(() => ws.terminate());
    const opened = once(ws, 'open');
    opened.catch(() => {});
    await arrived;
    await waitForFile(join(root, 'ready-1'));
    assert.equal(calls.length, 2, 'HTTP and WS must share one refresh child');
    assert.equal(calls[1].args.includes('--force-refresh'), true);
    assert.equal(
      remote.requests.length,
      1,
      'neither request may reach upstream before refresh completes',
    );
    await writeFile(join(root, 'release-1'), 'complete refresh');
    const [httpResult] = await Promise.all([pendingHttp, opened]);
    assert.equal(httpResult.status, 200);
    assert.equal(ws.protocol, 'v4.channel.k8s.io');
    assert.equal(calls.length, 2);
    assert.equal(remote.requests.length, 3);
    const httpReceived = remote.requests.find(
      (entry) => entry.url === '/api/k8s/apis/demo?watch=true',
    );
    const wsReceived = remote.requests.find((entry) => entry.url === '/wss/k8s/exec?stdin=true');
    assert.equal(httpReceived.headers.authorization, 'Bearer refreshed-cli-token');
    assert.equal(wsReceived.headers.authorization, 'Bearer refreshed-cli-token');
    assert.equal(wsReceived.headers['sec-websocket-protocol'], 'v4.channel.k8s.io');
    const message = once(ws, 'message');
    ws.send('shared-refresh-stream');
    assert.equal((await message)[0].toString(), 'shared-refresh-stream');
    const closed = once(ws, 'close');
    ws.close();
    await closed;

    const previousGeneration = (await tokenManager.getCredential()).generation;
    now = Date.parse('2030-01-01T00:09:00Z');
    const racingArrivals = bothRequestsArrived();
    const racingHttp = request(port, '/api/k8s/logout-race');
    const racingWs = rejectedUpgrade(port, '/wss/k8s/logout-race', {});
    await racingArrivals;
    await waitForFile(join(root, 'ready-2'));
    assert.equal(calls.length, 3);
    assert.equal(remote.requests.length, 3);
    assert.equal((await request(port, '/oauth2/sign_out')).status, 204);
    assert.equal((await racingHttp).status, 401);
    assert.equal(await racingWs, 401);
    assert.equal(calls[2].child.signalCode, 'SIGTERM');
    assert.equal(tokenManager.isCurrent(previousGeneration), false);
    await assert.rejects(tokenManager.getCredential(), AuthenticationRequiredError);
    assert.equal(remote.requests.length, 3, 'cancelled refresh must not forward either request');
    assert.equal(calls.length, 3, 'missing authentication must not start another browser login');

    assert.equal((await request(port, '/oauth2/sign_in')).status, 302);
    const afterSignIn = await request(port, '/api/k8s/signed-in-again');
    assert.equal(afterSignIn.status, 200);
    assert.equal(
      JSON.parse(afterSignIn.body).headers.authorization,
      'Bearer signed-in-again-cli-token',
    );
    assert.equal(calls.length, 4);
    const cacheArgument = (call) => call.args.find((arg) => arg.startsWith('--token-cache-dir='));
    assert.notEqual(cacheArgument(calls[0]), cacheArgument(calls[3]));
  },
);
