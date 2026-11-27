# Konflux UI

[![Build](https://img.shields.io/github/check-runs/konflux-ci/konflux-ui/main?nameFilter=Red%20Hat%20Konflux%20%2F%20konflux-ui-on-push&label=Build)](https://github.com/konflux-ci/konflux-ui/commits/main) [![EC](https://img.shields.io/github/check-runs/konflux-ci/konflux-ui/main?nameFilter=Red%20Hat%20Konflux%20%2F%20ec%20%2F%20konflux-ui&label=EC)](https://github.com/konflux-ci/konflux-ui/commits/main)

UI for [Konflux](https://github.com/konflux-ci/konflux-ci)

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](./CONTRIBUTING.md) to get started.
If you find a bug or want to request a feature, feel free to open an issue as well.

## Quick Start

**Prerequisites:** Node.js >= 24, Corepack, `kubectl`, and the
[kubelogin oidc-login plugin](https://github.com/int128/kubelogin) version 1.36.4 or newer
on `PATH`. See [local CLI authentication](docs/local-cli-auth.md) for certificate trust and login requirements.

Clone the repository, then run a single setup command (enables Corepack, installs dependencies, and starts the dev server):

```bash
git clone https://github.com/konflux-ci/konflux-ui.git && cd konflux-ui
yarn setup
```

Equivalent: `./setup.sh`

## Setting up development environment

This project includes a DevContainer for developing Konflux UI. Check that `kubectl`
and kubelogin 1.36.4 or newer are available inside the container, and install them if
absent before running `yarn start`. See the [DevContainer README](.devcontainer/README.md)
for configuration instructions.

### Manual installation

If you do not want to or cannot use the DevContainer, you can also setup the repository yourself.

**Prerequisites:**

- Node.js version >= 24
- Corepack enabled
- `kubectl` and the [kubelogin oidc-login plugin](https://github.com/int128/kubelogin) version 1.36.4 or newer on `PATH`

> **Note:** This project uses [Yarn Berry (v4.x)](https://yarnpkg.com/) as the package manager. The correct Yarn version is automatically managed via the `packageManager` field in `package.json` and Corepack.

A step by step series of examples that tell you how to get a development environment running:

1. Clone the repository

2. Enable Corepack (required for Yarn Berry)

   ```bash
   corepack enable
   ```

   > On some systems you may need `sudo corepack enable`

3. Install dependencies

   ```bash
   yarn install
   ```

4. Run the app in development mode
   ```bash
   yarn start
   ```

### Local UI authentication

`yarn start` authenticates through the configured deployment's public Dex `cli` client.
The local Node server obtains ID tokens with kubelogin, and webpack's development
server attaches them to upstream API and WebSocket requests. The UI runs at
`https://localhost:8080`; the default `.env` targets staging.

See [local CLI authentication](docs/local-cli-auth.md) for certificate trust, first login,
refresh, logout, and staging validation instructions.

If a system `yarn` wrapper keeps using an older Node.js after switching versions, run
the checked-in Yarn release with Node.js 24 directly:

```bash
nvm use 24
node .yarn/releases/yarn-4.12.0.cjs start
```

## Running with Konflux-ci

The default `.env` targets staging. To connect to a local Konflux deployment:

1. Follow the [local installation guide](https://konflux-ci.dev/konflux-ci/docs/installation/install-local/)
   to deploy Konflux.
2. Ensure that deployment's Dex issuer exposes a public client named `cli`, supports
   authorization code login with PKCE S256, and accepts kubelogin's loopback callback
   on port 8000 or 18000. The issuer must be available at `/idp/` on the configured
   upstream origin.
3. Set all four targets in `.env` to the same hostname and effective port, matching
   the configured Dex issuer. The default Kind deployment advertises
   `https://localhost:9443/idp/`, so use `localhost` even if `127.0.0.1` reaches the same
   server:

   ```dotenv
   AUTH_URL=https://localhost:9443/
   REGISTRATION_URL=https://localhost:9443/
   PROXY_URL=https://localhost:9443/
   PROXY_WEBSOCKET_URL=wss://localhost:9443/
   ```

4. Configure certificate trust for the upstream deployment. The local Node server
   verifies upstream TLS, so supply its CA with `NODE_EXTRA_CA_CERTS=/path/to/ca.pem`
   if needed. Kubelogin must also trust the issuer's CA through its system trust
   store. See [certificate configuration](docs/local-cli-auth.md#configure-targets-and-certificates).
5. Run `yarn start` and sign in at `https://localhost:8080`.

### Copy login command on a local cluster

On OpenShift, the UI derives the API server and OAuth URLs from a `*.apps.<clusterDomain>` hostname. You do not need extra ConfigMap fields for that case.

For Kind or a custom UI hostname, **merge** a `cliLogin` object into the existing `info.json` of ConfigMap `konflux-public-info` (namespace `konflux-info`). Do not replace `info.json` entirely — that document also holds `rbac` and other required fields.

konflux-operator reconciles this ConfigMap and will drop unknown fields, including `cliLogin`, unless the operator is extended to emit them. For a local cluster you can scale the operator deployment to 0 before patching, or wait for operator support.

Example field to merge into the current `info.json`:

```json
{
  "cliLogin": {
    "apiServerUrl": "https://127.0.0.1:<kind-api-port>",
    "authMode": "kubernetes",
    "kubeContext": "kind-konflux"
  }
}
```

## Available Scripts

In the project directory, you can run:

- `yarn build`: Builds the app for production using webpack with the production configuration file.
- `yarn size-limit`: Checks production bundle sizes against the gzip budgets in `.size-limit.json`. Run `yarn build` first. See [docs/bundle-size-budgets.md](docs/bundle-size-budgets.md).
- `yarn start`: Runs the app in development mode with server-side Dex CLI authentication. Opens the app in your default browser.
- `yarn test:dev-auth`: Tests the local CLI authentication helpers with Node's test runner.
- `yarn lint:dev-auth`: Lints the Node helpers and their tests.
- `yarn format:dev-auth`: Checks formatting of the Node helpers and their tests.
- `yarn test`: Runs unit tests using jest.
- `yarn coverage`: Runs the test suite with coverage report.
- `yarn lint`: Runs both TypeScript and SASS linting.
- `yarn lint:ts`: Lints TypeScript files.
- `yarn lint:sass`: Lints SASS files.

## Built With

- [Webpack](https://webpack.js.org/) - Module bundler
- [Jest](https://jestjs.io/) - Testing framework
- [ESLint](https://eslint.org/) - TypeScript linting
- [Stylelint](https://stylelint.io/) - SASS linting
