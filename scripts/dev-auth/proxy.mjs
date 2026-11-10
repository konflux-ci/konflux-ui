import { STATUS_CODES } from 'node:http';
import { constants } from 'node:http2';
import https from 'node:https';
import httpProxy from 'http-proxy';
import { LOCAL_ORIGIN } from './constants.mjs';

export { LOCAL_ORIGIN };

const MAX_RETURN_PATH_DECODE_DEPTH = 8;
const SIGN_IN_PROBE_TIMEOUT_MS = 5_000;

const ROUTES = {
  REGISTRATION: '/api/k8s/registration',
  KUBERNETES_API: '/api/k8s',
  KUBERNETES_WEBSOCKET: '/wss/k8s',
  USERINFO: '/oauth2/userinfo',
  SIGN_IN: '/oauth2/sign_in',
  START: '/oauth2/start',
  SIGN_OUT: '/oauth2/sign_out',
  OAUTH: '/oauth2',
};

const TARGET_NAMES = {
  auth: 'AUTH_URL',
  api: 'PROXY_URL',
  registration: 'REGISTRATION_URL',
  websocket: 'PROXY_WEBSOCKET_URL',
};

export function resolveTargets(env) {
  const targets = {};
  for (const [name, variable] of Object.entries(TARGET_NAMES)) {
    try {
      const value = env[variable];
      if (typeof value !== 'string' || !value || /[\\?#\x00-\x20\x7f]/.test(value))
        throw new Error();
      const url = new URL(value);
      if (
        url.protocol !== (name === 'websocket' ? 'wss:' : 'https:') ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/'
      )
        throw new Error();
      targets[name] = url;
    } catch {
      // Never put a supplied URL (which could contain credentials) in diagnostics.
      throw new Error(`Invalid ${variable} target configuration: expected a secure root URL.`);
    }
  }
  if (Object.values(targets).some((url) => url.host !== targets.auth.host)) {
    throw new Error('Invalid target configuration: all targets must use the AUTH_URL authority.');
  }
  return targets;
}

function under(path, prefix) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function pathname(req) {
  return (req.url ?? '').split('?')[0];
}

function respond(res, status, body = '') {
  if (res.destroyed || res.writableEnded) return;
  if (res.headersSent) {
    res.destroy();
    return;
  }
  res.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'text/plain; charset=utf-8',
    'x-content-type-options': 'nosniff',
  });
  res.end(body);
}

function rejectUpgrade(socket, status) {
  if (socket.destroyed) return;
  const reason = STATUS_CODES[status];
  socket.end(
    `HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nCache-Control: no-store\r\nContent-Length: 0\r\n\r\n`,
  );
}

function boundaryAllowed(req, origin, websocket = false, requireReferer = false) {
  if (req.headers.host !== new URL(origin).host) return false;
  const suppliedOrigin = req.headers.origin;
  const fetchSite = req.headers['sec-fetch-site'];
  if (fetchSite !== undefined && fetchSite !== 'same-origin') return false;
  if (suppliedOrigin !== undefined) {
    if (suppliedOrigin !== origin) return false;
  } else if (websocket || fetchSite !== 'same-origin') return false;
  if (requireReferer) {
    try {
      const referer = req.headers.referer;
      if (typeof referer !== 'string' || /[\\\x00-\x20\x7f]/.test(referer)) return false;
      if (new URL(referer).origin !== origin) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function localReturnPath(req, origin) {
  const rd = new URL(req.url, origin).searchParams.get('rd') ?? '/';
  let decoded = rd;
  // Check encoded backslashes/control characters as well as their literal forms.
  for (let depth = 0; depth < MAX_RETURN_PATH_DECODE_DEPTH; depth++) {
    if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\\\x00-\x1f\x7f]/.test(decoded))
      return null;
    let next;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return null;
    }
    if (next === decoded) return rd;
    decoded = next;
  }
  return null;
}

function authenticatedHeaders(req, token) {
  for (const key of Object.keys(req.headers)) {
    if (
      key === 'authorization' ||
      key === 'cookie' ||
      key === 'forwarded' ||
      // The local Node server already handles 100 Continue. Keeping Expect makes
      // http-proxy skip proxyReq, leaving the upstream watch outside our lifecycle.
      key === 'expect' ||
      /^(?:x-forwarded-|x-auth-request-|impersonate-)/i.test(key) ||
      /^(?:x-user|x-group|x-real-ip|(?:x-)?remote-(?:user|group))$/i.test(key)
    )
      delete req.headers[key];
  }
  req.headers.authorization = `Bearer ${token}`;
}

export function createDevAuthProxy({
  targets,
  tokenManager,
  origin = LOCAL_ORIGIN,
  ca,
  probeTimeoutMs = SIGN_IN_PROBE_TIMEOUT_MS,
}) {
  const proxy = httpProxy.createProxyServer({
    secure: true,
    followRedirects: false,
    changeOrigin: true,
    xfwd: false,
    ...(ca ? { ca } : {}),
  });
  const records = new Map();
  const probes = new Set();
  let epoch = 0;
  let closed = false;
  let closePromise;

  function invalidate() {
    epoch++;
    for (const probe of probes) probe.cancel();
    for (const record of records.values()) {
      record.outgoing?.destroy();
      record.upstream?.destroy();
      record.response?.destroy();
      record.socket?.destroy();
    }
    records.clear();
  }

  function track(req, response, socket) {
    const record = { response, socket, epoch };
    records.set(req, record);
    (response ?? socket).once('close', () => {
      record.outgoing?.destroy();
      record.upstream?.destroy();
      records.delete(req);
    });
  }

  function onOutgoing(outgoing, req) {
    const record = records.get(req);
    if (!record || closed || record.epoch !== epoch) {
      outgoing.destroy();
      return;
    }
    record.outgoing = outgoing;
    outgoing.on('upgrade', (_response, socket) => {
      record.upstream = socket;
      if (closed || record.epoch !== epoch || !records.has(req)) socket.destroy();
    });
  }
  proxy.on('proxyReq', onOutgoing);
  proxy.on('proxyReqWs', onOutgoing);
  // No error details leave this process: errors may include credential-bearing objects.
  proxy.on('error', (_error, req, res) => {
    if (res.writeHead)
      respond(
        res,
        pathname(req) === ROUTES.USERINFO
          ? constants.HTTP_STATUS_UNAUTHORIZED
          : constants.HTTP_STATUS_BAD_GATEWAY,
        'Upstream request failed.',
      );
    else rejectUpgrade(res, constants.HTTP_STATUS_BAD_GATEWAY);
  });
  proxy.on('proxyRes', (upstream, req, res) => {
    for (const name of Object.keys(upstream.headers)) {
      if (name.startsWith('access-control-')) delete upstream.headers[name];
    }
    const userinfo = pathname(req) === ROUTES.USERINFO;
    if (userinfo && upstream.statusCode !== constants.HTTP_STATUS_OK) {
      upstream.destroy();
      respond(res, constants.HTTP_STATUS_UNAUTHORIZED, 'Authentication required.');
      return;
    }
    // pipe() does not close its destination if the upstream watch is interrupted.
    upstream.on('aborted', () => res.destroy());
    upstream.on('error', () => res.destroy());
    if (!userinfo) return;
    res.writeHead(constants.HTTP_STATUS_OK, {
      'content-type': upstream.headers['content-type'] ?? 'application/json',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    upstream.pipe(res);
  });

  function targetFor(path, websocket = false) {
    if (under(path, ROUTES.REGISTRATION)) return targets.registration;
    if (under(path, ROUTES.KUBERNETES_API)) return targets.api;
    if (websocket && under(path, ROUTES.KUBERNETES_WEBSOCKET)) return targets.websocket;
    return targets.auth;
  }

  function isCurrent(value, started) {
    return !closed && epoch === started && value?.token && tokenManager.isCurrent(value.generation);
  }

  async function credential(operation, started) {
    const value = await tokenManager[operation]();
    return isCurrent(value, started) ? value : null;
  }

  function checkSignInReadiness(value) {
    return new Promise((resolve) => {
      let outgoing;
      let settled = false;
      const probe = { cancel: () => finish(0) };
      // An absolute deadline covers DNS, connection, TLS, and response headers.
      const deadline = setTimeout(() => finish(0), probeTimeoutMs);
      function finish(status) {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        probes.delete(probe);
        outgoing?.destroy();
        resolve(status);
      }
      probes.add(probe);
      try {
        outgoing = https.request(
          new URL(ROUTES.USERINFO, targets.auth),
          {
            method: 'GET',
            agent: false,
            rejectUnauthorized: true,
            ...(ca ? { ca } : {}),
            headers: { authorization: `Bearer ${value.token}`, accept: 'application/json' },
          },
          (response) => {
            // Only the status is needed. Never buffer or expose the userinfo body.
            response.on('error', () => {});
            finish(response.statusCode);
            response.destroy();
          },
        );
        outgoing.on('error', () => finish(0));
        outgoing.end();
      } catch {
        finish(0);
      }
    });
  }

  async function handleHttp(req, res, path) {
    const sessionEndpoint = [ROUTES.SIGN_IN, ROUTES.START, ROUTES.SIGN_OUT].includes(path);
    if (!boundaryAllowed(req, origin, false, sessionEndpoint)) {
      respond(res, constants.HTTP_STATUS_FORBIDDEN, 'Forbidden.');
      return;
    }
    if (under(path, ROUTES.OAUTH) && req.method !== 'GET') {
      respond(res, constants.HTTP_STATUS_METHOD_NOT_ALLOWED, 'Method not allowed.');
      return;
    }
    if (path === ROUTES.SIGN_OUT) {
      // Invalidate locally before awaiting CLI/cache cleanup.
      invalidate();
      await tokenManager.signOut();
      respond(res, constants.HTTP_STATUS_NO_CONTENT);
      return;
    }
    if (path === ROUTES.SIGN_IN || path === ROUTES.START) {
      const rd = localReturnPath(req, origin);
      if (rd === null) {
        respond(res, constants.HTTP_STATUS_BAD_REQUEST, 'Invalid return path.');
        return;
      }
      try {
        const started = epoch;
        const value = await credential('signIn', started);
        if (!value) {
          respond(res, constants.HTTP_STATUS_UNAUTHORIZED, 'Authentication required.');
          return;
        }
        const status = await checkSignInReadiness(value);
        // A late rejection from an old session must never invalidate a new login.
        if (!isCurrent(value, started)) {
          respond(res, constants.HTTP_STATUS_UNAUTHORIZED, 'Authentication required.');
          return;
        }
        if (status !== constants.HTTP_STATUS_OK) {
          if (status === constants.HTTP_STATUS_UNAUTHORIZED) {
            invalidate();
            await tokenManager.signOut();
          }
          throw new Error('Authentication service is unavailable.');
        }
        res.writeHead(constants.HTTP_STATUS_FOUND, { location: rd, 'cache-control': 'no-store' });
        res.end();
      } catch {
        if (res.destroyed || res.writableEnded) return;
        res.writeHead(constants.HTTP_STATUS_SERVICE_UNAVAILABLE, {
          'cache-control': 'no-store',
          'content-type': 'text/html; charset=utf-8',
          'content-security-policy': "default-src 'none'; style-src 'none'; frame-ancestors 'none'",
          'x-content-type-options': 'nosniff',
        });
        res.end(
          `<!doctype html><title>Sign-in failed</title><p>Sign-in could not complete. Please try again.</p><a href="${ROUTES.SIGN_IN}">Retry sign-in</a>`,
        );
      }
      return;
    }
    if (under(path, ROUTES.OAUTH) && path !== ROUTES.USERINFO) {
      respond(res, constants.HTTP_STATUS_NOT_FOUND, 'Not found.');
      return;
    }
    let value;
    try {
      value = await credential('getCredential', epoch);
    } catch {
      /* Missing/failed refresh requires explicit login. */
    }
    if (!value) {
      respond(res, constants.HTTP_STATUS_UNAUTHORIZED, 'Authentication required.');
      return;
    }
    if (res.destroyed || req.aborted) return;
    authenticatedHeaders(req, value.token);
    track(req, res);
    proxy.web(req, res, {
      target: targetFor(path).href,
      selfHandleResponse: path === ROUTES.USERINFO,
    });
  }

  function middleware(req, res, next) {
    const path = pathname(req);
    if (!under(path, ROUTES.KUBERNETES_API) && !under(path, ROUTES.OAUTH)) return next();
    void handleHttp(req, res, path).catch(() =>
      respond(
        res,
        path === ROUTES.USERINFO
          ? constants.HTTP_STATUS_UNAUTHORIZED
          : constants.HTTP_STATUS_BAD_GATEWAY,
        'Request failed.',
      ),
    );
  }

  function handlesUpgrade(req) {
    const path = pathname(req);
    return under(path, ROUTES.KUBERNETES_WEBSOCKET) || under(path, ROUTES.KUBERNETES_API);
  }

  function upgrade(req, socket, head) {
    if (!handlesUpgrade(req)) return;
    // Attach before awaiting credentials so client disconnects never become unhandled errors.
    socket.on('error', () => {});
    if (!boundaryAllowed(req, origin, true)) {
      rejectUpgrade(socket, constants.HTTP_STATUS_FORBIDDEN);
      return;
    }
    const started = epoch;
    void (async () => {
      let value;
      try {
        value = await credential('getCredential', started);
      } catch {
        /* No implicit login. */
      }
      if (!value) {
        rejectUpgrade(socket, constants.HTTP_STATUS_UNAUTHORIZED);
        return;
      }
      if (socket.destroyed) return;
      authenticatedHeaders(req, value.token);
      track(req, undefined, socket);
      proxy.ws(req, socket, head, { target: targetFor(pathname(req), true).href });
    })().catch(() => rejectUpgrade(socket, constants.HTTP_STATUS_BAD_GATEWAY));
  }

  function close() {
    if (closePromise) return closePromise;
    closed = true;
    invalidate();
    proxy.close();
    closePromise = Promise.resolve();
    return closePromise;
  }

  return { middleware, handlesUpgrade, upgrade, close };
}
