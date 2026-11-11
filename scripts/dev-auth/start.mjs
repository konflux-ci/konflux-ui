import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { LOCAL_ORIGIN } from './constants.mjs';
import { createDevAuthProxy, resolveTargets } from './proxy.mjs';
import { assertPrerequisites, createTokenManager } from './token-manager.mjs';

export async function startCli({
  env = process.env,
  loadConfig = async (authProxy) => (await import('#webpack-dev-config')).default(authProxy),
  checkPrerequisites = assertPrerequisites,
  tokenManagerFactory = createTokenManager,
  proxyFactory = createDevAuthProxy,
  createCompiler = webpack,
  createServer = (options, compiler) => new WebpackDevServer(options, compiler),
  signalSource = process,
  logger = (text) => process.stderr.write(text),
} = {}) {
  // Report prerequisites and unsafe target settings before creating any resources.
  await checkPrerequisites();
  const targets = resolveTargets(env);
  let tokenManager;
  let authProxy;
  let compiler;
  let server;
  let stopping;
  let configuring = false;

  const onSignal = () => {
    void stop().catch(() => {
      logger('Unable to fully stop the local CLI development server.\n');
      process.exitCode = 1;
    });
  };

  function stop() {
    if (stopping) return stopping;
    signalSource.removeListener('SIGINT', onSignal);
    signalSource.removeListener('SIGTERM', onSignal);
    stopping = (async () => {
      // Cancel authentication and credential-bearing connections before stopping
      // webpack. Each resource is still released if another cleanup fails.
      const results = await Promise.allSettled([
        Promise.resolve().then(() => authProxy?.close()),
        Promise.resolve().then(() => tokenManager?.close()),
      ]);
      for (const release of [
        () => server?.stop(),
        () =>
          compiler &&
          new Promise((resolve, reject) => {
            compiler.close((error) => (error ? reject(error) : resolve()));
          }),
      ]) {
        try {
          await release();
        } catch {
          results.push({ status: 'rejected' });
        }
      }
      if (results.some(({ status }) => status === 'rejected')) {
        throw new Error('Unable to fully stop the local CLI development server.');
      }
    })();
    return stopping;
  }

  try {
    let localHttps;
    if (env.DEV_AUTH_HTTPS_CERT || env.DEV_AUTH_HTTPS_KEY) {
      if (!env.DEV_AUTH_HTTPS_CERT || !env.DEV_AUTH_HTTPS_KEY) throw new Error();
      const [cert, key] = await Promise.all([
        readFile(env.DEV_AUTH_HTTPS_CERT),
        readFile(env.DEV_AUTH_HTTPS_KEY),
      ]);
      localHttps = { type: 'https', options: { cert, key } };
    }
    tokenManager = tokenManagerFactory({ issuerUrl: `${targets.auth.origin}/idp/`, logger });
    authProxy = proxyFactory({ targets, tokenManager });
    configuring = true;
    const { devServer, ...compilerOptions } = await loadConfig(authProxy);
    compiler = createCompiler(compilerOptions);
    const serverOptions = { ...devServer };
    if (localHttps) serverOptions.server = localHttps;
    server = createServer(serverOptions, compiler);
    configuring = false;
    await server.start();
    signalSource.on('SIGINT', onSignal);
    signalSource.on('SIGTERM', onSignal);
    logger(`CLI authentication enabled at ${LOCAL_ORIGIN}. Sign in from the UI.\n`);
    return { stop, server };
  } catch (error) {
    await stop().catch(() => {});
    if (configuring) {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error.';
      throw new Error(
        `Unable to configure the local CLI development server. Configuration error: ${detail}`,
      );
    }
    throw new Error(
      'Unable to start the local CLI development server. Check port 8080 and the local HTTPS certificate configuration.',
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startCli().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
