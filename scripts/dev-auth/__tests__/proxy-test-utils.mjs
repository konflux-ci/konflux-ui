import { once } from 'node:events';
import http from 'node:http';
import https from 'node:https';
import WebSocket, { WebSocketServer } from 'ws';
import { cert, key } from './test-certificate.mjs';

export { cert };

export const canonicalHeaders = {
  host: 'localhost:8080',
  origin: 'https://localhost:8080',
  referer: 'https://localhost:8080/ns/demo',
  'sec-fetch-site': 'same-origin',
};

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

export function credentials() {
  let generation = 0;
  const calls = { get: 0, signIn: 0, signOut: 0 };
  return {
    calls,
    async getCredential() {
      calls.get++;
      return { token: 'secret-id-token', generation };
    },
    async signIn() {
      calls.signIn++;
      return { token: 'secret-id-token', generation };
    },
    isCurrent: (value) => value === generation,
    async signOut() {
      calls.signOut++;
      generation++;
    },
    async close() {
      generation++;
    },
  };
}

export async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

export async function upstream(t, handler) {
  const requests = [];
  const server = https.createServer({ cert, key }, async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const entry = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: Buffer.concat(chunks).toString(),
    };
    requests.push(entry);
    if (handler) handler(req, res, entry);
    else {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(entry));
    }
  });
  const websocketServer = new WebSocketServer({ noServer: true });
  const connections = [];
  server.on('upgrade', (req, socket, head) => {
    requests.push({ url: req.url, method: req.method, headers: req.headers });
    websocketServer.handleUpgrade(req, socket, head, (ws) => {
      connections.push(ws);
      ws.on('message', (message) => ws.send(message));
    });
  });
  const port = await listen(server);
  t.after(async () => {
    for (const ws of connections) ws.terminate();
    websocketServer.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return { url: new URL(`https://localhost:${port}`), requests, connections };
}

export async function localProxy(t, createDevAuthProxy, options = {}) {
  const remote = options.remote ?? (await upstream(t));
  const targets = options.targets ?? {
    auth: remote.url,
    api: remote.url,
    registration: remote.url,
    websocket: new URL(remote.url.href.replace('https:', 'wss:')),
  };
  const tokenManager = options.tokenManager ?? credentials();
  const proxy = createDevAuthProxy({ targets, tokenManager, ca: cert, ...options });
  const server = http.createServer((req, res) => {
    proxy.middleware(req, res, () => {
      res.statusCode = 418;
      res.end('unowned');
    });
  });
  server.on('upgrade', (req, socket, head) => {
    if (proxy.handlesUpgrade(req)) proxy.upgrade(req, socket, head);
    else socket.end('HTTP/1.1 418 HMR untouched\r\nConnection: close\r\n\r\n');
  });
  const port = await listen(server);
  t.after(async () => {
    await proxy.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return { proxy, port, remote, tokenManager };
}

export function request(port, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        ...options,
        headers: Object.fromEntries(
          Object.entries({ ...canonicalHeaders, ...options.headers }).filter(
            ([, value]) => value !== undefined,
          ),
        ),
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('error', reject);
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString(),
          }),
        );
      },
    );
    req.on('error', reject);
    req.end(options.body);
  });
}

export function connect(port, path, headers = {}, protocols = ['v4.channel.k8s.io']) {
  return new WebSocket(`ws://127.0.0.1:${port}${path}`, protocols, {
    headers: { ...canonicalHeaders, ...headers },
  });
}

export async function rejectedUpgrade(port, path, headers) {
  const ws = connect(port, path, headers);
  ws.on('error', () => {});
  const [, response] = await once(ws, 'unexpected-response');
  response.resume();
  ws.terminate();
  return response.statusCode;
}
