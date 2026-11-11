# Local UI authentication with the Dex CLI client

`yarn start` starts the local UI with CLI authentication against the configured
upstream deployment, which defaults to staging. The local Node server obtains an ID
token with kubelogin, and webpack's development server attaches it to Kubernetes
HTTP/WebSocket requests and `/oauth2/userinfo`. React's authentication components use
their existing endpoints.

## How the ID token reaches the proxy

1. `yarn start` runs the Node launcher in `scripts/dev-auth/start.mjs`, which starts
   webpack-dev-server programmatically. The token manager and authentication proxy
   live in that same Node process: startup passes the `tokenManager` object directly
   to `createDevAuthProxy`. Webpack serves the UI over local HTTPS and handles hot
   module replacement (HMR).
2. The browser makes ordinary local UI requests and starts login through
   `/oauth2/sign_in`. The token manager invokes `kubectl oidc-login get-token` as a
   subprocess to complete the PKCE browser login. It captures the subprocess's
   `ExecCredential` JSON from stdout internally; kubelogin's normal instructions on
   stderr remain visible in the terminal.
3. The token manager keeps the ID token in memory, and kubelogin uses a private
   mode-0700 temporary cache for this server instance. For an authenticated request,
   the proxy calls `tokenManager.getCredential()` and waits for any shared renewal
   operation. A credential generation check prevents a token invalidated by logout
   or replacement from being forwarded.
4. For approved Kubernetes API, registration, `/oauth2/userinfo`, and Kubernetes
   WebSocket routes to the configured upstream (staging by default), the proxy strips
   browser cookies, incoming `Authorization`, and forwarded identity headers, then
   adds `Authorization: Bearer <ID token>`. The browser receives profile information
   from `/oauth2/userinfo`, never the token. Tokens are never sent to browser
   JavaScript or browser storage, embedded in the bundle, printed as credential JSON,
   or placed in UI URLs. The existing Lightspeed proxy receives no CLI credentials;
   chatbot authentication is outside this workflow.

## Prerequisites

- Node.js 24 or newer, Corepack, and installed project dependencies (`yarn install`).
- `kubectl` and the [kubelogin oidc-login plugin](https://github.com/int128/kubelogin)
  version 1.36.4 or newer on `PATH`. With Krew, install it using
  `kubectl krew install oidc-login`; check the version with `kubectl oidc-login --version`.
- Browser access to the upstream deployment and an account with the required namespace permissions.
- A public Dex client named `cli` on that deployment, supporting authorization code
  login with PKCE S256 and kubelogin's loopback callback on port 8000 or 18000.
- A free local port 8080 and at least one free loopback callback port, 8000 or 18000.

DevContainer users also need `kubectl` and kubelogin 1.36.4 or newer inside the
container; install them if absent. The launcher reports missing local prerequisites
before starting webpack-dev-server.

Forward container port 8080 to **host port 8080**, and callback ports 8000 and
18000 to the **same host port numbers** using the editor's Ports panel. The UI's
canonical origin and Dex loopback callbacks do not support remapped host ports;
free conflicting host ports instead of accepting an automatically substituted port.
Keep these forwards local to your host. If kubelogin cannot launch a browser inside
the container, open the login URL printed in its terminal instructions in your host
browser. See the [DevContainer guide](../.devcontainer/README.md#port-forwarding).

If a system `yarn` wrapper hardcodes an older Node.js runtime, select Node.js 24 and
invoke the checked-in Yarn release directly:

```bash
nvm use 24
node .yarn/releases/yarn-4.12.0.cjs start
```

## Configure targets and certificates

The existing `.env` points to staging. `AUTH_URL`, `PROXY_URL`, and `REGISTRATION_URL`
must be HTTPS root URLs; `PROXY_WEBSOCKET_URL` must be a WSS root URL. All four must
have the same hostname and effective port. Credentials, paths, queries, and fragments
are not accepted in these URLs. The Dex issuer is `AUTH_URL`'s origin plus `/idp/`.
The target hostname and port must match the deployment's configured Dex issuer;
using an IP address that reaches the same server does not make the issuer match.
For example, the default Kind issuer is `https://localhost:9443/idp/`, so all four
targets must use `localhost:9443`.

For a local Konflux deployment, configure its public `cli` client and certificate
trust before pointing these targets at it; see [the local deployment instructions](../README.md#running-with-konflux-ci).

Use the canonical local address **`https://localhost:8080`**. The server binds only to
`127.0.0.1`; an IP-address URL, another hostname, or a different port is rejected for
authenticated requests. Open the UI first and use its login flow; manually entering a
login/logout endpoint without same-origin browser provenance is rejected.

Webpack's existing HTTPS certificate generation is available by default. For a locally
trusted certificate, install [mkcert](https://github.com/FiloSottile/mkcert) and generate
a certificate outside the repository:

```bash
mkcert -install
mkdir -p "$HOME/.local/share/konflux-ui"
mkcert -cert-file "$HOME/.local/share/konflux-ui/localhost.pem" \
  -key-file "$HOME/.local/share/konflux-ui/localhost-key.pem" localhost 127.0.0.1
chmod 600 "$HOME/.local/share/konflux-ui/localhost-key.pem"
DEV_AUTH_HTTPS_CERT="$HOME/.local/share/konflux-ui/localhost.pem" \
DEV_AUTH_HTTPS_KEY="$HOME/.local/share/konflux-ui/localhost-key.pem" yarn start
```

Both certificate variables must be set together. Restart the browser if it needs to
reload the local trust store. Do not commit a development private key.

Upstream TLS certificates are always verified. If the configured deployment uses a
private or organizational CA, install that CA in the appropriate system/browser trust
stores and, for Node, set `NODE_EXTRA_CA_CERTS=/path/to/upstream-ca.pem` before
starting the launcher. Kubelogin
also needs to trust the issuer's CA through the system trust store. Do not disable TLS
verification to work around certificate errors.

## Login and renewal

```bash
yarn start
```

Open `https://localhost:8080` if the browser does not open automatically. The first UI
sign-in starts `kubectl oidc-login get-token` using authorization code login with PKCE
S256 and the `email`, `profile`, `groups`, and `offline_access` scopes. Follow the
browser login and terminal instructions. Kubelogin handles its registered loopback
callback on port 8000 or 18000, which the deployment's public `cli` client must accept.

Requests reuse the ID token until it is within 60 seconds of expiration. The helper
then asks kubelogin to refresh it. Concurrent HTTP and WebSocket requests wait for the
same operation before reaching the upstream deployment. Kubelogin may reopen the browser if renewal
requires login. Authentication has a 180-second limit and the subprocess has a
210-second overall limit. Failed authentication returns the session to an
unauthenticated state; ordinary requests do not keep launching browsers. Use the UI
sign-in flow or the local error page's retry link to try again.

Before redirecting back to the UI, sign-in checks that the upstream accepts the token at
`/oauth2/userinfo`. A failed check shows the local retry page, preventing repeated
login redirects. A rejected token is discarded; a temporary upstream failure keeps
the token available for an explicit retry.

## Logout and shutdown

Use the UI's logout action. Local `/oauth2/sign_out` invalidates pending credentials,
cancels an active login/refresh, closes authenticated streams and WebSockets, and
removes this instance's private cache. The UI can immediately start a new sign-in with
a fresh cache. The UI's existing logout flow navigates to sign-in afterward, so Dex
SSO may let it sign back in immediately.

Logout clears this development session. It leaves the developer's global kubelogin
cache and other CLI sessions alone and does not end browser-wide Dex SSO. Ctrl+C or
SIGTERM stops the launcher and removes its cache. Keep the development server limited
to trusted local code; pages served by this origin can act as the logged-in developer.

## Checks and staging smoke test

```bash
yarn format:dev-auth
yarn lint:dev-auth
yarn test:dev-auth
```

The server-only ES modules use native Node package aliases (`#dev-auth/*` and
`#webpack-dev-config`) for cross-directory imports. Their lint configuration reuses
the project's JavaScript style rules; browser and TypeScript rules stay in the UI
configuration. Tests use Node's built-in runner, mock kubelogin processes, and real
local HTTPS/WebSocket servers, without a staging account. CI runs the helper checks alongside the existing UI checks.

Before accepting the workflow against staging:

1. Start `yarn start`, complete browser login, and confirm the local
   `/oauth2/userinfo` request succeeds with user information and no credential data.
2. Select an accessible namespace and load its resources, checking registration and
   `/api/k8s` requests as appropriate for the account.
3. Open an existing watch or live log stream and confirm it stays connected. Confirm
   webpack's `/ws` hot-reload connection also works.
4. Keep the server running until the ID token is within its renewal window, then
   request a resource and confirm renewal succeeds. Complete browser login if asked.
5. Log out, confirm old authenticated streams close, and complete re-login. Confirm
   a new request succeeds and the global kubelogin session remains unaffected.

Inspect browser requests, responses, URLs, and storage for credential leakage. Never
copy tokens into a bug report. Repeat these checks against any local Konflux deployment
before relying on that deployment's authentication configuration.
