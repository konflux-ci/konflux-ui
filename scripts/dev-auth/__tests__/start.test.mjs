import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { startCli } from '#dev-auth/start.mjs';
import { cert, key } from './test-certificate.mjs';

function fixture() {
  const calls = [];
  const signalSource = new EventEmitter();
  const compiler = {
    close: (callback) => {
      calls.push('compiler closed');
      callback();
    },
  };
  const tokenManager = {
    close: async () => {
      calls.push('credentials closed');
    },
  };
  const authProxy = {
    close: async () => {
      calls.push('proxy closed');
    },
  };
  const server = {
    start: async () => {
      calls.push('server started');
    },
    stop: async () => {
      calls.push('server stopped');
    },
  };
  const env = {
    AUTH_URL: 'https://staging.example/',
    PROXY_URL: 'https://staging.example/',
    REGISTRATION_URL: 'https://staging.example/',
    PROXY_WEBSOCKET_URL: 'wss://staging.example/',
  };
  const config = {
    mode: 'development',
    entry: './app.js',
    devServer: { host: '127.0.0.1', port: 8080, server: 'https' },
  };
  const options = {
    env,
    signalSource,
    logger: (message) => calls.push(message),
    checkPrerequisites: async () => {
      calls.push('prerequisites');
    },
    loadConfig: async (passedProxy) => {
      assert.equal(passedProxy, authProxy);
      return config;
    },
    tokenManagerFactory: (settings) => {
      assert.equal(settings.issuerUrl, 'https://staging.example/idp/');
      return tokenManager;
    },
    proxyFactory: (settings) => {
      assert.equal(settings.tokenManager, tokenManager);
      assert.equal(settings.targets.websocket.href, 'wss://staging.example/');
      return authProxy;
    },
    createCompiler: (settings) => {
      assert.deepEqual(settings, { mode: 'development', entry: './app.js' });
      return compiler;
    },
    createServer: (settings, passedCompiler) => {
      assert.equal(settings.host, '127.0.0.1');
      assert.equal(settings.port, 8080);
      assert.equal(settings.server, 'https');
      assert.equal(passedCompiler, compiler);
      return server;
    },
  };
  return { calls, signalSource, server, compiler, tokenManager, options, config };
}

test('launcher wires authentication into the development configuration and releases resources on shutdown', async () => {
  const { calls, signalSource, options, config } = fixture();
  const running = await startCli(options);
  assert.equal(calls[0], 'prerequisites');
  assert.ok(calls.includes('server started'));
  assert.ok(config.devServer);
  signalSource.emit('SIGTERM');
  await running.stop();
  assert.deepEqual(
    calls.filter((value) => value.endsWith('closed') || value.endsWith('stopped')),
    ['proxy closed', 'credentials closed', 'server stopped', 'compiler closed'],
  );
  await running.stop();
  assert.equal(calls.filter((value) => value === 'compiler closed').length, 1);
  assert.equal(signalSource.listenerCount('SIGINT'), 0);
  assert.equal(signalSource.listenerCount('SIGTERM'), 0);
});

test('missing prerequisites are reported before configuration or authentication resources are created', async () => {
  const { calls, options } = fixture();
  options.checkPrerequisites = async () => {
    throw new Error('Install kubelogin.');
  };
  options.loadConfig = async () => {
    throw new Error('must not load');
  };
  await assert.rejects(startCli(options), /Install kubelogin/);
  assert.deepEqual(calls, []);
});

test('mismatched upstreams are rejected before server startup', async () => {
  const { calls, options } = fixture();
  options.env.PROXY_URL = 'https://foreign.example/';
  await assert.rejects(startCli(options), /AUTH_URL authority/);
  assert.deepEqual(calls, ['prerequisites']);
});

test('a startup failure cleans authentication and compiler resources without exposing dependency errors', async () => {
  const { calls, signalSource, options, server } = fixture();
  server.start = async () => {
    throw new Error('sensitive dependency detail');
  };
  await assert.rejects(startCli(options), (error) => {
    assert.match(error.message, /Unable to start/);
    assert.doesNotMatch(error.message, /sensitive/);
    return true;
  });
  assert.ok(calls.includes('proxy closed'));
  assert.ok(calls.includes('credentials closed'));
  assert.ok(calls.includes('compiler closed'));
  assert.equal(signalSource.listenerCount('SIGTERM'), 0);
});

for (const phase of ['loadConfig', 'createCompiler', 'createServer']) {
  test(`reports ${phase} failures as configuration errors and cleans acquired resources`, async () => {
    const { calls, options, signalSource } = fixture();
    options[phase] = () => {
      throw new Error('Invalid webpack fixture setting.');
    };

    await assert.rejects(startCli(options), (error) => {
      assert.match(error.message, /configuration/i);
      assert.match(error.message, /Invalid webpack fixture setting/);
      assert.doesNotMatch(error.message, /port 8080|certificate configuration/);
      return true;
    });
    assert.ok(calls.includes('proxy closed'));
    assert.ok(calls.includes('credentials closed'));
    assert.equal(calls.includes('compiler closed'), phase === 'createServer');
    assert.ok(!calls.includes('server started'));
    assert.equal(signalSource.listenerCount('SIGTERM'), 0);
  });
}

test('cleanup continues through a failing resource and reports only a safe message', async () => {
  const { calls, options, tokenManager } = fixture();
  tokenManager.close = async () => {
    throw new Error('sensitive cache error');
  };
  const running = await startCli(options);
  await assert.rejects(running.stop(), /Unable to fully stop/);
  assert.ok(calls.includes('server stopped'));
  assert.ok(calls.includes('compiler closed'));
});

test('launcher supports a trusted localhost certificate without mutating the loaded configuration', async (t) => {
  const { options, config } = fixture();
  const directory = await mkdtemp(join(tmpdir(), 'cli-auth-certificate-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  options.env.DEV_AUTH_HTTPS_CERT = join(directory, 'localhost-cert.pem');
  options.env.DEV_AUTH_HTTPS_KEY = join(directory, 'localhost-key.pem');
  await Promise.all([
    writeFile(options.env.DEV_AUTH_HTTPS_CERT, cert, { mode: 0o600 }),
    writeFile(options.env.DEV_AUTH_HTTPS_KEY, key, { mode: 0o600 }),
  ]);
  let serverOptions;
  options.createServer = (settings) => {
    serverOptions = settings;
    return { start: async () => {}, stop: async () => {} };
  };
  const running = await startCli(options);
  assert.equal(serverOptions.server.type, 'https');
  assert.equal(serverOptions.server.options.cert.toString(), cert);
  assert.equal(serverOptions.server.options.key.toString(), key);
  assert.equal(config.devServer.server, 'https');
  await running.stop();
});

test('launcher refuses an incomplete local certificate configuration before listening', async () => {
  const { options, calls } = fixture();
  options.env.DEV_AUTH_HTTPS_CERT = '/a/local/certificate';
  await assert.rejects(startCli(options), /certificate configuration/);
  assert.ok(!calls.includes('server started'));
});
