# AGENTS.md — konflux-ui

## Prerequisites

- Read `docs/best-practices.md` before writing any code.
- Read `docs/pr-review-guidelines.md` before reviewing or creating PRs.
- Read `CONTRIBUTING.md` (section "Commit Guidelines") before committing.
- Fill every section of `.github/PULL_REQUEST_TEMPLATE.md` when creating a PR.

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

- **Framework:** Jest + React Testing Library (SWC transform via `.swcrc`)
- **Test location:** `__tests__/` directories alongside source, `.spec.ts` or `.spec.tsx` extension
- **Test data:** `__data__/` directories alongside `__tests__/` for mock data and fixtures
- **Test ID attribute:** `data-test` (configured in `config/jest.setup.js`)
- **Prefer semantic queries:** `getByRole`, `getByLabelText`, `getByText` -- avoid `getByTestId`
- **User interactions:** use `userEvent.setup()` + `userEvent`, not `fireEvent`
- **No snapshot tests**

### Rendering Utilities (from `~/unit-test-utils/`)

- `renderWithQueryClientAndRouter` -- BrowserRouter + QueryClientProvider
- `renderWithQueryClient` -- QueryClientProvider only (no router)
- `formikRenderer` -- Formik + QueryClientProvider
- `namespaceRenderer` -- NamespaceContext wrapper
- `routerRenderer` -- BrowserRouter wrapper only

### Mock Utilities (from `~/unit-test-utils/`)

- `createK8sWatchResourceMock` -- mock `useK8sWatchResource`
- `createK8sUtilMock(name)` -- mock any named k8s utility
- `mockUseNamespaceHook(ns)` -- mock `useNamespace`; returns the mock for further configuration
- `mockAccessReviewUtil(name, value)` -- mock RBAC utilities (e.g., `useAccessReviewForModel`)
- `createUseParamsMock(params)` -- mock `useParams`
- `createReactRouterMock(name)` -- mock any `react-router-dom` export
- `createKubearchiveUtilMock(name)` -- mock kubearchive utilities
- `mockAnalyticsServiceFn(name)` -- mock `analyticsService` instance methods
- `waitForLoadingToFinish` -- waits for `role="progressbar"` to be removed

### Global Mocks (in `config/jest.setup.js`)

These modules are auto-mocked with `jest.requireActual` passthrough: `src/k8s`, `react-router-dom`, `src/shared/providers/Namespace/useNamespaceInfo`, `src/utils/rbac`, `src/hooks/useApplications`, `src/hooks/useKonfluxPublicInfo`, `src/kubearchive/fetch-utils`. You can `jest.mocked(fn).mockReturnValue(...)` in tests without additional `jest.mock()` calls.

## Commits

- Conventional Commits enforced by commitlint: `feat:`, `fix:`, `chore:`, etc.
- Husky pre-commit runs `lint-staged` (prettier + restricted-imports lint on TS, stylelint on SCSS)
- Husky commit-msg runs commitlint and auto-adds `Assisted-by: Claude` trailer for authorized users
- Never add `Co-Authored-By` to commit messages; use `Assisted-by: Claude` trailer instead

## Code Conventions

- **No `as` type assertions** -- use type guards or fix the actual type (`as const` and test mocks excepted)
- **No `useEffect` to derive state from props** -- use `useMemo`
- **`useCallback` only when reference stability matters** (memoized child props, dependency arrays, hook returns)
- **Memoize return values from custom hooks** (objects, arrays, functions)
- **PatternFly components over raw HTML** -- use PF layout components (Flex, Stack, Split, Grid), PF design tokens for spacing/color
- **No inline styles** -- use co-located SCSS with BEM naming
- **No magic strings** -- use constants from `src/consts/`
- **Data-driven objects/arrays over if/else chains** for type/status mappings
- **`useLocalStorage` hook** from `~/shared/hooks/useLocalStorage` -- never use `localStorage` directly
- **Analytics in components:** use `useTrackAnalyticsEvent()` from `~/analytics/hooks`, never `analyticsService` directly
- **RBAC-gated actions:** use `useAccessReviewForModel` from `~/utils/rbac`

### TypeScript Strictness

`tsconfig.json` enforces `noUnusedLocals` and `noUnusedParameters`. Unused variables/params will fail `yarn type-checks` even if lint passes. Prefix intentionally unused params with `_`.

### State Management

| Data type | Tool |
|---|---|
| K8s resources (watch) | `useK8sWatchResource` from `~/k8s` |
| Server data (REST) | React Query (`@tanstack/react-query`) |
| Global client state | Zustand stores |
| Scoped UI state | React Context |
| Persistent preferences | `useLocalStorage` from `~/shared/hooks/useLocalStorage` |

## Feature Flags

Flags are defined in `src/feature-flags/flags.ts`. No backend; purely client-side via localStorage + URL params.

- Render gating: `<IfFeature flag="flagName">` component
- Logic gating: `useIsOnFeatureFlag('flagName')` hook
- Route gating (no hooks): `ensureFeatureFlagOnLoader('flagName')` in loader/lazy
- Test via URL: `?ff=flagName` or `?ff_flagName=true`
- New flags: set `defaultEnabled: false`, `status: 'wip'`
- Cleanup: when stable, set `status: 'ready'` + `defaultEnabled: true`, verify, then delete the flag entry

Flags can have runtime guards (conditions). See `docs/conditions.md` for the `registerCondition` / `allOf` / `anyOf` API and available conditions (`isKubearchiveEnabled`, `isStagingCluster`, etc.). Register new conditions in `src/registers.ts`.

## Stack Quick Reference

React 18, TypeScript 5.5, Webpack, Yarn 4 (Berry) via Corepack, PatternFly 5, React Router v6, React Query, Zustand, Formik + Yup, SCSS.
