# AGENTS.md — konflux-ui

## Build & Test Commands

| Task              | Command                              |
| ----------------- | ------------------------------------ |
| Install deps      | `corepack enable && yarn install`    |
| Unit tests        | `yarn test`                          |
| Single test file  | `yarn test -- path/to/file.spec.tsx` |
| Lint              | `yarn lint`                          |
| Import boundaries | `yarn lint:restricted-imports`       |
| Type check        | `yarn type-checks`                   |
| Start dev server  | `yarn start`                         |

CI runs two parallel jobs on Node 24: **lint** (`yarn lint` -> `yarn lint:restricted-imports` -> `yarn type-checks`) and **test** (`yarn test`).

## Setup

One-command setup: `yarn setup` or `./setup.sh` (checks Node.js >= 24, enables Corepack, installs dependencies, starts dev server)

## Key Conventions

- `~/` -> `src/`, `@routes/` -> `src/routes/` -- use absolute imports, never `../../../`
- `@patternfly/react-icons` -> use `@patternfly/react-icons/dist/esm/icons/<kebab-case-name>`
- `lodash` -> use `lodash-es/<funcName>` (jest maps `lodash-es` to `lodash` automatically)
- No `console.*` -> use `logger` from `~/monitoring/logger`
- No snapshot tests; test ID attribute is `data-test` (not `data-testid`)
- `noUnusedLocals` and `noUnusedParameters` enforced -- prefix unused params with `_`
- Never add `Co-Authored-By` to commit messages; use `Assisted-by: Claude` trailer instead

## Commits

Conventional Commits enforced by commitlint: `feat:`, `fix:`, `chore:`, etc. Husky pre-commit runs `lint-staged` (prettier + restricted-imports on TS, stylelint on SCSS).

## PR Conventions

- Read `docs/pr-review-guidelines.md` before reviewing or creating PRs.
- Fill every section of `.github/PULL_REQUEST_TEMPLATE.md` when creating a PR.

## Guidelines (docs/guidelines/)

Detailed guides for AI agents and developers:

| Document                                      | Use When                                                     |
| --------------------------------------------- | ------------------------------------------------------------ |
| `docs/guidelines/component-guidelines.md`     | Creating new components (imports, architecture, conventions) |
| `docs/guidelines/table-component.md`          | Building list views with the shared table system             |
| `docs/guidelines/layout-and-pages.md`         | Creating pages (list, detail, form, modal patterns)          |
| `docs/guidelines/hooks-and-data-fetching.md`  | Using K8s hooks, React Query, RBAC, state management         |
| `docs/guidelines/patternfly-guidelines.md`    | PatternFly components, layout, design tokens, SCSS           |
| `docs/guidelines/unit-testing.md`             | Writing unit tests (mocks, renderers, patterns)              |
| `docs/guidelines/single-file-verification.md` | Fast per-file lint/type-check workflow (overview)            |
| `docs/guidelines/single-file-lint.md`         | Lint one `.ts`, `.tsx`, or `.scss` file                      |
| `docs/guidelines/single-file-type-check.md`   | Type-check one file (or fall back to project-wide)           |

## Other Documentation (docs/)

| Document                       | Purpose                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `docs/best-practices.md`       | Full coding standards and conventions                                 |
| `docs/pr-review-guidelines.md` | PR review checklist                                                   |
| `docs/feature-flags.md`        | Feature flag system (flags, persistence, URL grammar, lifecycle)      |
| `docs/conditions.md`           | Feature flag conditions (`allOf`/`anyOf` guards, `registerCondition`) |
| `docs/analytics.md`            | Segment analytics (events, config, codegen, obfuscation)              |
| `docs/kubearchive.md`          | KubeArchive dual-source data (cluster + archive hooks, deduplication) |
| `docs/e2e-coverage.md`         | E2E coverage via Istanbul + Cypress                                   |
