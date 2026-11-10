import { spawn } from 'node:child_process';
import { chmod, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MINIMUM_NODE_MAJOR_VERSION = 24;
const MINIMUM_KUBELOGIN_VERSION = [1, 36, 4];
const KUBECTL_TIMEOUT_MS = 210_000;
const KUBECTL_KILL_GRACE_MS = 1_000;
const KUBECTL_MAX_OUTPUT_BYTES = 1024 * 1024;
const VERSION_CHECK_TIMEOUT_MS = 10_000;
const VERSION_CHECK_MAX_OUTPUT_BYTES = 16_384;
const REFRESH_WINDOW_MS = 60_000;
const CACHE_DIRECTORY_MODE = 0o700;
const OIDC_LISTEN_ADDRESSES = '127.0.0.1:8000,127.0.0.1:18000';
const AUTHENTICATION_TIMEOUT_SECONDS = 180;

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('Authentication required. Sign in to continue.');
    this.name = 'AuthenticationRequiredError';
  }
}

/** Capture only bounded stdout. Child output and raw errors never become public errors. */
function runKubectl(
  args,
  {
    spawnProcess = spawn,
    logger = () => {},
    signal,
    timeoutMs = KUBECTL_TIMEOUT_MS,
    killGraceMs = KUBECTL_KILL_GRACE_MS,
    maxOutputBytes = KUBECTL_MAX_OUTPUT_BYTES,
  } = {},
) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AuthenticationRequiredError());
      return;
    }
    let child;
    try {
      child = spawnProcess('kubectl', args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      reject(new AuthenticationRequiredError());
      return;
    }
    let chunks = [];
    let bytes = 0;
    let failed = false;
    let closed = false;
    let stopping = false;
    let killTimer;

    const stop = () => {
      failed = true;
      chunks = [];
      if (closed || stopping) return;
      stopping = true;
      child.kill('SIGTERM');
      // A process can exit synchronously in response to cancellation.
      if (!closed) {
        killTimer = setTimeout(() => child.kill('SIGKILL'), killGraceMs);
      }
    };
    const timeout = setTimeout(stop, timeoutMs);
    child.once('error', stop);
    child.stdout.on('data', (chunk) => {
      if (failed) return;
      const buffer = Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > maxOutputBytes) stop();
      else chunks.push(buffer);
    });
    child.stderr.on('data', (chunk) => {
      if (failed) return;
      try {
        logger(chunk.toString());
      } catch {
        stop();
      }
    });
    child.once('close', (code) => {
      closed = true;
      clearTimeout(timeout);
      clearTimeout(killTimer);
      signal?.removeEventListener('abort', stop);
      if (failed || code !== 0 || signal?.aborted) {
        chunks = [];
        reject(new AuthenticationRequiredError());
      } else {
        resolve(Buffer.concat(chunks).toString('utf8'));
        chunks = [];
      }
    });
    signal?.addEventListener('abort', stop, { once: true });
    if (signal?.aborted) stop();
  });
}

export async function assertPrerequisites({
  nodeVersion = process.versions.node,
  ...processOptions
} = {}) {
  const major = Number(nodeVersion.replace(/^v/, '').split('.')[0]);
  if (!Number.isInteger(major) || major < MINIMUM_NODE_MAJOR_VERSION) {
    throw new Error(
      `Node.js ${MINIMUM_NODE_MAJOR_VERSION} or newer is required for local CLI authentication.`,
    );
  }
  try {
    const output = await runKubectl(['oidc-login', '--version'], {
      timeoutMs: VERSION_CHECK_TIMEOUT_MS,
      maxOutputBytes: VERSION_CHECK_MAX_OUTPUT_BYTES,
      ...processOptions,
      logger: () => {},
    });
    const match = output.match(/\bv?(\d+)\.(\d+)\.(\d+)(?![\w.-])/);
    if (!match) throw new AuthenticationRequiredError();
    const [majorVersion, minorVersion, patchVersion] = match.slice(1).map(Number);
    const [minimumMajor, minimumMinor, minimumPatch] = MINIMUM_KUBELOGIN_VERSION;
    if (
      majorVersion < minimumMajor ||
      (majorVersion === minimumMajor && minorVersion < minimumMinor) ||
      (majorVersion === minimumMajor &&
        minorVersion === minimumMinor &&
        patchVersion < minimumPatch)
    )
      throw new AuthenticationRequiredError();
  } catch {
    throw new Error(
      `Install kubectl oidc-login (kubelogin) version ${MINIMUM_KUBELOGIN_VERSION.join('.')} or newer.`,
    );
  }
}

function parseCredential(output, now) {
  const { status } = JSON.parse(output);
  const timestamp = status?.expirationTimestamp;
  const rfc3339 =
    typeof timestamp === 'string' &&
    /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$/.test(timestamp);
  const expiresAt = rfc3339 ? Date.parse(timestamp) : NaN;
  const validCalendarDate =
    Number.isFinite(expiresAt) &&
    new Date(`${timestamp.slice(0, 10)}T00:00:00Z`)
      .toISOString()
      .startsWith(timestamp.slice(0, 10));
  if (
    typeof status?.token !== 'string' ||
    !status.token.trim() ||
    !validCalendarDate ||
    expiresAt <= now
  )
    throw new AuthenticationRequiredError();
  return { token: status.token, expiresAt };
}

export function createTokenManager({
  issuerUrl,
  logger = (text) => process.stderr.write(text),
  now = Date.now,
  tmpRoot = tmpdir(),
  ...processOptions
}) {
  let credential;
  let generation = 0;
  let epoch = 0;
  let closed = false;
  let operation;
  let cacheDirectory;
  let cleanup = Promise.resolve();
  const ownedCaches = new Set();

  const publicCredential = () => ({ token: credential.token, generation: credential.generation });
  const fresh = () => credential && credential.expiresAt - now() > REFRESH_WINDOW_MS;

  function start(forceRefresh) {
    const controller = new AbortController();
    const operationEpoch = epoch;
    const priorCleanup = cleanup;
    const current = { controller };
    const checkActive = () => {
      if (closed || controller.signal.aborted || operationEpoch !== epoch) {
        throw new AuthenticationRequiredError();
      }
    };
    operation = current;
    current.promise = (async () => {
      try {
        await priorCleanup;
        checkActive();
        if (!cacheDirectory) {
          cacheDirectory = await mkdtemp(join(tmpRoot, 'konflux-dev-auth-'));
          ownedCaches.add(cacheDirectory);
          await chmod(cacheDirectory, CACHE_DIRECTORY_MODE);
          checkActive();
        }
        const args = [
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
          `--listen-address=${OIDC_LISTEN_ADDRESSES}`,
          `--authentication-timeout-sec=${AUTHENTICATION_TIMEOUT_SECONDS}`,
          `--token-cache-dir=${cacheDirectory}`,
        ];
        if (forceRefresh) args.push('--force-refresh');
        const output = await runKubectl(args, {
          ...processOptions,
          logger,
          signal: controller.signal,
        });
        checkActive();
        const parsed = parseCredential(output, now());
        credential = { ...parsed, generation: ++generation };
        return publicCredential();
      } catch {
        if (operationEpoch === epoch) {
          credential = undefined;
          generation++;
        }
        throw new AuthenticationRequiredError();
      } finally {
        if (operation === current) operation = undefined;
      }
    })();
    return current.promise;
  }

  function invalidate() {
    epoch++;
    generation++;
    credential = undefined;
    const previousOperation = operation;
    operation = undefined;
    previousOperation?.controller.abort();
    const previousCleanup = cleanup;
    cleanup = (async () => {
      await previousCleanup;
      await previousOperation?.promise.catch(() => {});
      // New operations wait for this cleanup, including when mkdir was still pending at sign-out.
      for (const path of ownedCaches) {
        try {
          await rm(path, { recursive: true, force: true });
        } catch {
          throw new Error('Unable to remove the private authentication cache.');
        }
        ownedCaches.delete(path);
      }
      cacheDirectory = undefined;
    })();
    return cleanup;
  }

  return {
    async signIn() {
      if (closed) throw new AuthenticationRequiredError();
      if (operation) return operation.promise;
      if (fresh()) return publicCredential();
      return start(Boolean(credential));
    },
    async getCredential() {
      if (closed) throw new AuthenticationRequiredError();
      if (operation) return operation.promise;
      if (!credential) throw new AuthenticationRequiredError();
      if (fresh()) return publicCredential();
      return start(true);
    },
    isCurrent(candidateGeneration) {
      return !closed && credential !== undefined && credential.generation === candidateGeneration;
    },
    signOut() {
      return invalidate();
    },
    close() {
      closed = true;
      return invalidate();
    },
  };
}
