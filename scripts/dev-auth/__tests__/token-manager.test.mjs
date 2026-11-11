import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import fs, { access, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import {
  assertPrerequisites,
  AuthenticationRequiredError,
  createTokenManager,
} from '#dev-auth/token-manager.mjs';

const issuerUrl = 'https://issuer.example/realms/test';
const initialNow = Date.parse('2030-01-01T00:00:00Z');
const tokenSecret = 'secret-token-never-log';
const credential = (token = tokenSecret, expirationTimestamp = '2030-01-01T00:05:00Z') =>
  JSON.stringify({
    apiVersion: 'client.authentication.k8s.io/v1',
    kind: 'ExecCredential',
    spec: {},
    status: { token, expirationTimestamp },
  });
const fixture = fileURLToPath(new URL('./fixtures/token-kubectl.mjs', import.meta.url));
const descendantFixture = fileURLToPath(
  new URL('./fixtures/token-kubectl-descendant.mjs', import.meta.url),
);

async function waitFor(check) {
  const end = Date.now() + 3000;
  while (!(await check())) {
    assert.ok(Date.now() < end, 'condition did not become true');
    await delay(5);
  }
}
async function exists(path) {
  return access(path).then(
    () => true,
    () => false,
  );
}

function failCacheRemovals(t) {
  const failures = new Set();
  const realRm = fs.rm;
  const removal = t.mock.method(fs, 'rm', async (path, options) => {
    if (failures.has(path)) throw new Error('simulated private cache removal failure');
    return realRm(path, options);
  });
  syncBuiltinESMExports();
  t.after(() => {
    removal.mock.restore();
    syncBuiltinESMExports();
  });
  return failures;
}

async function setup(t, configs = [{}], options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'token-manager-test-'));
  const calls = [];
  const logs = [];
  let now = initialNow;
  const spawnProcess = (command, args, spawnOptions) => {
    const index = calls.length;
    const config = {
      stdout: credential(),
      ...configs[Math.min(index, configs.length - 1)],
      recordPath: join(root, `record-${index}.json`),
      readyPath: join(root, `ready-${index}`),
    };
    const child = spawn(process.execPath, [config.fixturePath ?? fixture, ...args], {
      ...spawnOptions,
      env: { ...process.env, TOKEN_FIXTURE_CONFIG: JSON.stringify(config) },
    });
    calls.push({ command, args, options: spawnOptions, child, config });
    return child;
  };
  const manager = createTokenManager({
    issuerUrl,
    logger: (text) => logs.push(text),
    spawnProcess,
    now: () => now,
    tmpRoot: root,
    ...options,
  });
  t.after(async () => {
    await manager.close();
    await rm(root, { recursive: true, force: true });
  });
  return { manager, root, calls, logs, setNow: (value) => (now = value) };
}

// Break caught: ordinary requests opening the browser without explicit sign-in.
test('missing credentials require explicit sign-in without starting a process', async (t) => {
  const { manager, calls } = await setup(t);
  await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
  assert.equal(calls.length, 0);
});

// Break caught: wrong OAuth parameters, shared cache, shell execution, or logging credential stdout.
test('explicit sign-in runs kubelogin with PKCE and a private cache', async (t) => {
  const { manager, root, calls, logs } = await setup(t, [{ stderr: 'Open browser to sign in.\n' }]);
  const result = await manager.signIn();
  assert.equal(result.token, tokenSecret);
  assert.equal(manager.isCurrent(result.generation), true);
  assert.equal(calls[0].command, 'kubectl');
  assert.equal(calls[0].options.shell, false);
  const cacheArg = calls[0].args.at(-1);
  assert.ok(cacheArg.startsWith(`--token-cache-dir=${root}/`));
  const cache = cacheArg.slice('--token-cache-dir='.length);
  assert.equal((await stat(cache)).mode & 0o777, 0o700);
  assert.deepEqual(calls[0].args, [
    'oidc-login',
    'get-token',
    `--oidc-issuer-url=${issuerUrl}`,
    '--oidc-client-id=cli',
    '--grant-type=authcode',
    '--oidc-pkce-method=S256',
    '--oidc-extra-scope=email',
    '--oidc-extra-scope=profile',
    '--oidc-extra-scope=groups',
    '--oidc-extra-scope=offline_access',
    '--listen-address=127.0.0.1:8000,127.0.0.1:18000',
    '--authentication-timeout-sec=180',
    cacheArg,
  ]);
  assert.equal(logs.join(''), 'Open browser to sign in.\n');
  assert.equal(logs.join('').includes(tokenSecret), false);
});

// Break caught: unnecessary browser opening and refresh at the wrong expiry boundary.
test('reuses credentials until the sixty-second window then forces one refresh', async (t) => {
  const { manager, calls, setNow } = await setup(t, [
    {},
    { stdout: credential('renewed', '2030-01-01T00:10:00Z') },
  ]);
  const first = await manager.signIn();
  setNow(Date.parse('2030-01-01T00:03:59.999Z'));
  assert.deepEqual(await manager.getCredential(), first);
  assert.deepEqual(await manager.signIn(), first);
  assert.equal(calls.length, 1);
  setNow(Date.parse('2030-01-01T00:04:00Z'));
  const renewed = await manager.getCredential();
  assert.equal(renewed.token, 'renewed');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].args.includes('--force-refresh'), true);
  assert.equal(
    calls[0].args.at(-1),
    calls[1].args.filter((arg) => arg.startsWith('--token-cache-dir='))[0],
  );
  assert.equal(manager.isCurrent(first.generation), false);
  assert.equal(manager.isCurrent(renewed.generation), true);
});

// Break caught: independent concurrent auth children corrupting the same cache.
test('concurrent sign-ins share one subprocess and result', async (t) => {
  const { manager, calls } = await setup(t);
  const results = await Promise.all([manager.signIn(), manager.signIn(), manager.signIn()]);
  assert.deepEqual(results, [results[0], results[0], results[0]]);
  assert.equal(calls.length, 1);
});

test('concurrent refreshes and explicit sign-in share one subprocess', async (t) => {
  const { manager, calls, setNow } = await setup(t, [
    {},
    { stdout: credential('renewed', '2030-01-01T00:10:00Z') },
  ]);
  await manager.signIn();
  setNow(Date.parse('2030-01-01T00:04:00Z'));
  const results = await Promise.all([
    manager.getCredential(),
    manager.getCredential(),
    manager.signIn(),
  ]);
  assert.equal(calls.length, 2);
  assert.deepEqual(
    results.map((result) => result.token),
    ['renewed', 'renewed', 'renewed'],
  );
});

// Break caught: accepting malformed, missing, empty, expired, or invalid credentials.
for (const [name, stdout] of [
  ['invalid JSON', `{${tokenSecret}`],
  ['absent status', '{}'],
  ['empty token', credential('')],
  ['whitespace token', credential('  ')],
  ['missing expiry', JSON.stringify({ status: { token: tokenSecret } })],
  ['invalid expiry', credential(tokenSecret, 'not-a-date')],
  ['non-RFC3339 expiry', credential(tokenSecret, 'January 1, 2031')],
  ['impossible calendar expiry', credential(tokenSecret, '2030-02-30T00:00:00Z')],
  ['expired token', credential(tokenSecret, '2029-12-31T23:59:59Z')],
  ['expiry at current time', credential(tokenSecret, '2030-01-01T00:00:00Z')],
]) {
  test(`rejects ${name} and latches authentication until explicit retry`, async (t) => {
    const { manager, calls, logs } = await setup(t, [{ stdout }, {}]);
    await assert.rejects(manager.signIn(), (error) => {
      assert.ok(error instanceof AuthenticationRequiredError);
      assert.equal(String(error).includes(tokenSecret), false);
      return true;
    });
    await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
    assert.equal(calls.length, 1);
    assert.equal(logs.join('').includes(tokenSecret), false);
    assert.equal((await manager.signIn()).token, tokenSecret);
    assert.equal(calls.length, 2);
  });
}

// Break caught: keeping the old credential after a refresh error or retrying on each request.
test('failed refresh invalidates the old credential and requires explicit retry', async (t) => {
  const { manager, calls, setNow } = await setup(t, [{}, { exitCode: 1 }, {}]);
  const first = await manager.signIn();
  setNow(Date.parse('2030-01-01T00:04:00Z'));
  await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
  assert.equal(manager.isCurrent(first.generation), false);
  await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
  assert.equal(calls.length, 2);
  await manager.signIn();
  assert.equal(calls.length, 3);
});

// Break caught: public errors revealing raw child output or subprocess exceptions.
test('nonzero subprocess status never includes captured token output in errors', async (t) => {
  const { manager, logs } = await setup(t, [{ exitCode: 1 }]);
  await assert.rejects(manager.signIn(), (error) => {
    assert.ok(error instanceof AuthenticationRequiredError);
    assert.equal(String(error).includes(tokenSecret), false);
    assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(logs.join('').includes(tokenSecret), false);
});

test('subprocess spawn errors are sanitized and latched', async (t) => {
  const { manager } = await setup(t, [], {
    spawnProcess: () => {
      throw new Error(tokenSecret);
    },
  });
  await assert.rejects(manager.signIn(), (error) => {
    assert.ok(error instanceof AuthenticationRequiredError);
    assert.equal(String(error).includes(tokenSecret), false);
    return true;
  });
  await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
});

test('asynchronous subprocess errors are sanitized and latched', async (t) => {
  const { manager } = await setup(t, [], {
    spawnProcess: (_command, _args, options) => spawn('/missing-token-kubectl', [], options),
  });
  await assert.rejects(manager.signIn(), AuthenticationRequiredError);
  await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
});

// Break caught: unbounded captured stdout consuming memory.
test('rejects oversized stdout without logging it', async (t) => {
  const { manager, logs } = await setup(t, [{ stdout: tokenSecret.repeat(100) }], {
    maxOutputBytes: 100,
  });
  await assert.rejects(manager.signIn(), AuthenticationRequiredError);
  assert.equal(logs.join('').includes(tokenSecret), false);
});

// Break caught: timeout failing to terminate a child that ignores SIGTERM.
test('timeout escalates to SIGKILL and waits for subprocess exit', async (t) => {
  const { manager, calls } = await setup(t, [{ hang: true, ignoreTerm: true }], {
    timeoutMs: 1000,
    killGraceMs: 20,
  });
  await assert.rejects(manager.signIn(), AuthenticationRequiredError);
  assert.equal(calls[0].child.signalCode, 'SIGKILL');
  await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
});

// Break caught: deleted caches being recreated by live children or late credentials resurrecting auth.
for (const operation of ['login', 'refresh']) {
  test(`sign-out cancels ${operation}, invalidates immediately, and waits before cache removal`, async (t) => {
    const configs =
      operation === 'login'
        ? [{ hang: true, ignoreTerm: true }]
        : [{}, { hang: true, ignoreTerm: true }];
    const { manager, root, calls, setNow } = await setup(t, configs, { killGraceMs: 20 });
    let previous;
    if (operation === 'refresh') {
      previous = await manager.signIn();
      setNow(Date.parse('2030-01-01T00:04:00Z'));
    }
    const pending = operation === 'login' ? manager.signIn() : manager.getCredential();
    const rejected = assert.rejects(pending, AuthenticationRequiredError);
    const index = operation === 'login' ? 0 : 1;
    await waitFor(() => exists(join(root, `ready-${index}`)));
    const cache = calls[index].args
      .find((arg) => arg.startsWith('--token-cache-dir='))
      .split('=')[1];
    const logout = manager.signOut();
    if (previous) assert.equal(manager.isCurrent(previous.generation), false);
    assert.equal(await exists(cache), true);
    await logout;
    await rejected;
    assert.equal(calls[index].child.signalCode, 'SIGKILL');
    assert.equal(await exists(cache), false);
    await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
  });
}

// Break caught: browser descendants inheriting stderr keeping cancellation and cache cleanup pending.
for (const cancellation of ['sign-out', 'timeout']) {
  for (const exitAfterSpawn of [false, true]) {
    test(`${cancellation} releases descendant-held stderr after ${exitAfterSpawn ? 'normal' : 'cancelled'} child exit`, async (t) => {
      const { manager, root, calls } = await setup(
        t,
        [{ fixturePath: descendantFixture, exitAfterSpawn }],
        {
          timeoutMs: cancellation === 'timeout' ? 1000 : 10_000,
          killGraceMs: 20,
        },
      );
      const rejected = assert.rejects(manager.signIn(), AuthenticationRequiredError);
      await waitFor(() => calls.length > 0);
      const child = calls[0].child;
      const cache = calls[0].args.find((arg) => arg.startsWith('--token-cache-dir=')).split('=')[1];
      const cacheAtExit =
        child.exitCode !== null
          ? Promise.resolve(existsSync(cache))
          : new Promise((resolve) => child.once('exit', () => resolve(existsSync(cache))));
      await waitFor(() => exists(join(root, 'ready-0')));
      const descendantPid = Number(await readFile(join(root, 'ready-0'), 'utf8'));
      if (exitAfterSpawn) await waitFor(() => child.exitCode === 0);
      const completed = cancellation === 'sign-out' ? manager.signOut() : rejected;
      try {
        assert.equal(
          await Promise.race([completed.then(() => true), delay(1500).then(() => false)]),
          true,
          'cancellation waited for a descendant-owned pipe after the owned child exited',
        );
        assert.equal(await cacheAtExit, true, 'cache was removed before the owned child exited');
        assert.equal(child.signalCode, exitAfterSpawn ? null : 'SIGKILL');
        assert.doesNotThrow(() => process.kill(descendantPid, 0));
        await manager.signOut();
        assert.equal(await exists(cache), false);
        await rejected;
      } finally {
        process.kill(descendantPid, 'SIGKILL');
        await completed;
        await rejected;
      }
    });
  }
}

test('discards a successful child result delivered while cancellation is racing', async (t) => {
  let child;
  const { manager } = await setup(t, [], {
    spawnProcess: () => {
      child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      child.kill = () => {
        child.stdout.end(credential());
        child.emit('exit', 0, null);
        child.emit('close', 0, null);
        return true;
      };
      return child;
    },
  });
  const login = manager.signIn();
  const rejected = assert.rejects(login, AuthenticationRequiredError);
  await waitFor(() => child !== undefined);
  await manager.signOut();
  await rejected;
  await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
});

test('successful child output drains after exit before credentials are accepted', async (t) => {
  let child;
  const { manager } = await setup(t, [], {
    spawnProcess: () => {
      child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      child.kill = () => true;
      return child;
    },
  });
  const login = manager.signIn();
  await waitFor(() => child !== undefined);
  const output = credential();
  child.stdout.write(output.slice(0, 30));
  child.emit('exit', 0, null);
  child.stdout.end(output.slice(30));
  child.stderr.end();
  child.emit('close', 0, null);
  assert.equal((await login).token, tokenSecret);
});

// Break caught: caches shared between instances, global-cache deletion, or reuse after sign-out.
test('managers have independent caches and remove only their own cache', async (t) => {
  const first = await setup(t);
  const globalMarker = join(first.root, 'global-cache-keep');
  await writeFile(globalMarker, 'existing credentials');
  await first.manager.signIn();
  const second = createTokenManager({
    issuerUrl,
    tmpRoot: first.root,
    now: () => initialNow,
    spawnProcess: (command, args, options) => {
      const firstArgs = first.calls[0].args;
      assert.notEqual(
        args.find((arg) => arg.startsWith('--token-cache-dir=')),
        firstArgs.at(-1),
      );
      return spawn(process.execPath, [fixture, ...args], {
        ...options,
        env: {
          ...process.env,
          TOKEN_FIXTURE_CONFIG: JSON.stringify({
            stdout: credential(),
            recordPath: join(first.root, 'second-record'),
          }),
        },
      });
    },
  });
  t.after(() => second.close());
  const firstGeneration = (await first.manager.getCredential()).generation;
  const secondCredential = await second.signIn();
  await first.manager.signOut();
  assert.equal(await readFile(globalMarker, 'utf8'), 'existing credentials');
  assert.equal(first.manager.isCurrent(firstGeneration), false);
  assert.equal(second.isCurrent(secondCredential.generation), true);
  assert.equal((await second.getCredential()).token, tokenSecret);
});

test('explicit sign-in after sign-out uses a new cache and generation', async (t) => {
  const { manager, calls } = await setup(t);
  const first = await manager.signIn();
  await manager.signOut();
  const second = await manager.signIn();
  assert.notEqual(calls[0].args.at(-1), calls[1].args.at(-1));
  assert.notEqual(first.generation, second.generation);
  assert.equal(manager.isCurrent(first.generation), false);
});

// Break caught: one failed rm permanently poisoning all later sign-out and close attempts.
test('failed sign-out reports the error and can retry a transient cache removal failure', async (t) => {
  const failures = failCacheRemovals(t);
  const { manager, calls } = await setup(t);
  const first = await manager.signIn();
  const cache = calls[0].args.at(-1).slice('--token-cache-dir='.length);
  failures.add(cache);
  await assert.rejects(manager.signOut(), /Unable to remove the private authentication cache/);
  assert.equal(manager.isCurrent(first.generation), false);
  await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
  assert.equal(await exists(cache), true);

  failures.delete(cache);
  await manager.signOut();
  assert.equal(await exists(cache), false);
});

// Break caught: failed deletion reusing old credentials or skipping newer caches during cleanup.
test('failed old cache removal permits a fresh sign-in and still removes every other cache', async (t) => {
  const failures = failCacheRemovals(t);
  const { manager, calls } = await setup(t);
  await manager.signIn();
  const oldCache = calls[0].args.at(-1).slice('--token-cache-dir='.length);
  failures.add(oldCache);
  await assert.rejects(manager.signOut(), /Unable to remove the private authentication cache/);

  assert.equal((await manager.signIn()).token, tokenSecret);
  const newCache = calls[1].args.at(-1).slice('--token-cache-dir='.length);
  assert.notEqual(newCache, oldCache);
  await assert.rejects(manager.signOut(), /Unable to remove the private authentication cache/);
  assert.equal(await exists(oldCache), true);
  assert.equal(await exists(newCache), false, 'a failed old cache prevented newer cache removal');

  failures.delete(oldCache);
  await manager.close();
  assert.equal(await exists(oldCache), false);
});

test('sign-in during sign-out waits for old child cleanup before creating a new cache', async (t) => {
  const { manager, calls, root } = await setup(t, [{ hang: true, ignoreTerm: true }, {}], {
    killGraceMs: 20,
  });
  const rejected = assert.rejects(manager.signIn(), AuthenticationRequiredError);
  await waitFor(() => exists(join(root, 'ready-0')));
  const logout = manager.signOut();
  const login = manager.signIn();
  await logout;
  await rejected;
  assert.equal((await login).token, tokenSecret);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].child.signalCode, 'SIGKILL');
});

test('close permanently prevents sign-in and removes all owned cache directories', async (t) => {
  const { manager, root } = await setup(t);
  const first = await manager.signIn();
  const closing = manager.close();
  assert.equal(manager.isCurrent(first.generation), false);
  await closing;
  await assert.rejects(manager.signIn(), AuthenticationRequiredError);
  await assert.rejects(manager.getCredential(), AuthenticationRequiredError);
  assert.equal(
    (await readdir(root)).some((name) => name.startsWith('konflux-dev-auth-')),
    false,
  );
});

// Break caught: launching unsupported runtimes or plugins instead of giving actionable prerequisites.
test('prerequisites reject Node before checking kubelogin', async () => {
  let called = false;
  await assert.rejects(
    assertPrerequisites({
      nodeVersion: '23.9.0',
      spawnProcess: () => {
        called = true;
        throw new Error('unexpected');
      },
    }),
    /Node.*24/,
  );
  assert.equal(called, false);
});

for (const [version, accepted] of [
  ['v1.36.3', false],
  ['v1.36.4', true],
  ['v1.37.0', true],
  ['v2.0.0', true],
  ['unrecognized', false],
]) {
  test(`prerequisites ${accepted ? 'accept' : 'reject'} kubelogin ${version}`, async (t) => {
    const { calls } = await setup(t);
    const options = {
      nodeVersion: '24.0.0',
      spawnProcess: (command, args, spawnOptions) => {
        calls.push({ command, args, options: spawnOptions });
        return spawn(
          process.execPath,
          ['-e', `require("node:fs").writeSync(1, ${JSON.stringify(`kubelogin ${version}\n`)})`],
          spawnOptions,
        );
      },
    };
    if (accepted) await assertPrerequisites(options);
    else await assert.rejects(assertPrerequisites(options), /kubectl oidc-login.*1\.36\.4/);
    assert.equal(calls[0].command, 'kubectl');
    assert.deepEqual(calls[0].args, ['oidc-login', '--version']);
    assert.equal(calls[0].options.shell, false);
  });
}

// Break caught: shutdown before asynchronous mkdir finishes leaking a private cache.
test('sign-out immediately after sign-in prevents subprocess launch', async (t) => {
  const { manager, calls, root } = await setup(t);
  const rejected = assert.rejects(manager.signIn(), AuthenticationRequiredError);
  await manager.signOut();
  await rejected;
  assert.equal(calls.length, 0);
  assert.equal((await readdir(root)).length, 0);
});

// Break caught: closing an active sign-in accepting a late token or leaving its child alive.
test('close cancels an active login and permanently refuses another sign-in', async (t) => {
  const { manager, calls, root } = await setup(t, [{ hang: true, ignoreTerm: true }], {
    killGraceMs: 20,
  });
  const rejected = assert.rejects(manager.signIn(), AuthenticationRequiredError);
  await waitFor(() => exists(join(root, 'ready-0')));
  await manager.close();
  await rejected;
  assert.equal(calls[0].child.signalCode, 'SIGKILL');
  await assert.rejects(manager.signIn(), AuthenticationRequiredError);
});
