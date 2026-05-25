# AGENTS.md — konflux-ui

## Prerequisites

- Read `docs/best-practices.md` before writing any code.
- Read `docs/pr-review-guidelines.md` before reviewing or creating PRs.
- Read `CONTRIBUTING.md` (section "Commit Guidelines") before committing.
- Fill every section of `.github/PULL_REQUEST_TEMPLATE.md` when creating a PR.

## Guidelines (docs/guidelines/)

Detailed guides for AI agents and developers:

| Document | Use When |
|---|---|
| `docs/guidelines/component-guidelines.md` | Creating new components (imports, architecture, conventions) |
| `docs/guidelines/table-component.md` | Building list views with the shared table system |
| `docs/guidelines/layout-and-pages.md` | Creating pages (list, detail, form, modal patterns) |
| `docs/guidelines/hooks-and-data-fetching.md` | Using K8s hooks, React Query, RBAC, state management |
| `docs/guidelines/patternfly-guidelines.md` | PatternFly components, layout, design tokens, SCSS |
| `docs/guidelines/unit-testing.md` | Writing unit tests (mocks, renderers, patterns) |

## Other Documentation (docs/)

| Document | Purpose |
|---|---|
| `docs/best-practices.md` | Full coding standards and conventions |
| `docs/pr-review-guidelines.md` | PR review checklist |
| `docs/feature-flags.md` | Feature flag system (flags, persistence, URL grammar, lifecycle) |
| `docs/conditions.md` | Feature flag conditions (`allOf`/`anyOf` guards, `registerCondition`) |
| `docs/analytics.md` | Segment analytics (events, config, codegen, obfuscation) |
| `docs/kubearchive.md` | KubeArchive dual-source data (cluster + archive hooks, deduplication) |
| `docs/e2e-coverage.md` | E2E coverage via Istanbul + Cypress |

## Commands

| Task | Command |
|---|---|
| Install deps | `corepack enable && yarn install` |
| Dev server | `yarn start` |
| Unit tests | `yarn test` |
| Single test file | `yarn test -- path/to/file.spec.tsx` |
| Lint (all) | `yarn lint` |
| Lint TS only | `yarn lint:ts` |
| Import boundaries | `yarn lint:restricted-imports` |
| Stylelint | `yarn lint:sass` |
| Type check | `yarn type-checks` |
| Coverage | `yarn coverage` |
| Analytics codegen | `yarn generate:analytics-types` |

CI runs: `yarn lint` -> `yarn lint:restricted-imports` -> `yarn type-checks` -> `yarn test` (Node 20 + 22).

## Path Aliases

- `~/` -> `src/` (use for all imports; relative imports like `../../../` are not allowed)
- `@routes/` -> `src/routes/`

Configured in `tsconfig.json`, resolved via `aliases.config.js` for webpack and jest.

## Import Boundaries (enforced by CI)

`.eslintrc.restrict-imports.cjs` enforces strict dependency zones. Key rules:

- `src/types/` -> may only import from itself
- `src/models/` -> may import from `models`, `types`
- `src/k8s/` -> may import from `k8s`, `types/k8s`
- `src/shared/` -> may import from `shared`, `k8s`, `types/k8s`
- `src/utils/` -> may import from `utils`, `types`, `k8s`, `models`, `consts`, `kubearchive`, `auth`, `shared`, `routes`
- `src/feature-flags/` -> may only import from itself (and `components/modal`)
- `src/kubearchive/` -> may import from `kubearchive`, `k8s`, `types/k8s`

Run `yarn lint:restricted-imports` to verify before pushing.

## Restricted Imports (ESLint)

- `@patternfly/react-icons` -> use `@patternfly/react-icons/dist/esm/icons/<kebab-case-name>` instead
- `lodash` -> use `lodash-es/<funcName>` instead (jest maps `lodash-es` to `lodash` automatically)
- No `console.*` -> use `logger` from `~/monitoring/logger`

## Key Directories

| Directory | Purpose |
|---|---|
| `src/components/` | Feature-specific UI components |
| `src/shared/` | Reusable components/hooks with no business logic |
| `src/hooks/` | Custom React hooks |
| `src/utils/` | Utility functions |
| `src/k8s/` | Kubernetes resource helpers |
| `src/types/` | Shared TypeScript types |
| `src/models/` | Resource model definitions |
| `src/consts/` | Constants and enums |
| `src/routes/` | Route definitions (React Router v6 data router) |
| `src/feature-flags/` | Client-side feature flag system |
| `src/kubearchive/` | KubeArchive integration |
| `src/unit-test-utils/` | Test mocks and rendering helpers |
| `src/monitoring/` | Logger service (replaces `console.*`) |
| `src/analytics/` | Segment analytics integration |
| `src/auth/` | Authentication utilities |
| `src/pages/` | Top-level page components |
| `e2e-tests/` | Cypress E2E tests (separate `package.json`, run `yarn install` there separately) |

## Testing

See `docs/guidelines/unit-testing.md` for full testing patterns, mock utilities, rendering utilities, and examples.

Quick reference:
- **Framework:** Jest + React Testing Library (SWC transform via `.swcrc`)
- **Test location:** `__tests__/` directories alongside source, `.spec.ts` or `.spec.tsx` extension
- **Test data:** `__data__/` directories alongside `__tests__/` for mock data and fixtures
- **Test ID attribute:** `data-test` (configured in `config/jest.setup.js`)
- **No snapshot tests**

## Commits

- Conventional Commits enforced by commitlint: `feat:`, `fix:`, `chore:`, etc.
- Husky pre-commit runs `lint-staged` (prettier + restricted-imports lint on TS, stylelint on SCSS)
- Husky commit-msg runs commitlint and auto-adds `Assisted-by: Claude` trailer for authorized users
- Never add `Co-Authored-By` to commit messages; use `Assisted-by: Claude` trailer instead

## Code Conventions

See `docs/guidelines/component-guidelines.md` for full conventions with examples.

### TypeScript Strictness

`tsconfig.json` enforces `noUnusedLocals` and `noUnusedParameters`. Unused variables/params will fail `yarn type-checks` even if lint passes. Prefix intentionally unused params with `_`.

## Feature Flags

See `docs/feature-flags.md` for the full system. See `docs/conditions.md` for runtime guards.

Quick reference:
- Render gating: `<IfFeature flag="flagName">` component
- Logic gating: `useIsOnFeatureFlag('flagName')` hook
- Route gating (no hooks): `ensureFeatureFlagOnLoader('flagName')` in loader/lazy
- Test via URL: `?ff=flagName` or `?ff_flagName=true`
- New flags: set `defaultEnabled: false`, `status: 'wip'`
- Cleanup: when stable, set `status: 'ready'` + `defaultEnabled: true`, verify, then delete the flag entry

## Stack Quick Reference

React 18, TypeScript 5.5, Webpack, Yarn 4 (Berry) via Corepack, PatternFly 5, React Router v6, React Query, Zustand, Formik + Yup, SCSS.
