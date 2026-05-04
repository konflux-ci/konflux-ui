# Claude Code — konflux-ui

## Coding Standards & Review

- Read and follow `docs/best-practices.md` before writing any code.
- Read and follow `docs/pr-review-guidelines.md` before reviewing or creating PRs.

## Commit Conventions

Read and follow `CONTRIBUTING.md` — section "Commit Guidelines" — before creating any commit.

## Pull Requests

Read `.github/PULL_REQUEST_TEMPLATE.md` and fill every section when creating a PR.

## Setup

- One-command setup: `./setup.sh` (checks Node.js >= 20, enables Corepack, installs dependencies, starts dev server)

## Architecture

- **Framework:** React 18 with TypeScript
- **Bundler:** Webpack (configs: `webpack.dev.config.js`, `webpack.prod.config.js`, `webpack.instrumented.config.js`)
- **Package manager:** Yarn 4 (Berry) via Corepack
- **UI library:** PatternFly 5 (`@patternfly/react-core`, `react-table`, `react-topology`, etc.)
- **Routing:** React Router v6 (`react-router-dom`)
- **State management:** Zustand for global state, React Query (`@tanstack/react-query`) for server state
- **Forms:** Formik + Yup validation
- **Styling:** SCSS modules with PatternFly tokens
- **Testing:** Jest + React Testing Library (SWC transform)
- **Linting:** ESLint, Stylelint, Prettier (enforced via husky + lint-staged)
- **Path aliases:** `~/` maps to `src/`, `@routes/` maps to `src/routes/`

## Yarn Commands

| Command | Description |
|---|---|
| `yarn start` | Start webpack dev server with dotenvx for env loading |
| `yarn build` | Production build via `webpack.prod.config.js` |
| `yarn build:instrumented` | Instrumented build for code coverage (Istanbul) |
| `yarn test` | Run Jest unit tests |
| `yarn coverage` | Run tests with coverage report (single-threaded, excludes pact tests) |
| `yarn lint` | Run all linters (TypeScript ESLint + Stylelint) |
| `yarn lint:ts` | ESLint for `.ts`/`.tsx` files, zero warnings allowed |
| `yarn lint:restricted-imports` | Check for restricted import patterns |
| `yarn lint:sass` | Stylelint for SCSS files |
| `yarn type-checks` | TypeScript type checking (`tsc --noEmit`) |
| `yarn analyze` | Bundle analysis with source-map-explorer |
| `yarn analyze:webpack` | Bundle analysis with webpack-bundle-analyzer |
| `yarn generate:analytics-types` | Generate TypeScript types from analytics schema |
