# Konflux UI -- Best Practices

Coding standards and development practices for the konflux-ui codebase. These apply to all contributors -- human and AI alike.

For the PR review checklist companion, see [pr-review-guidelines.md](./pr-review-guidelines.md).

---

## Table of Contents

- [Styling: PatternFly-First Approach](#styling-patternfly-first-approach)
- [When Custom CSS Is Acceptable](#when-custom-css-is-acceptable)
- [Imports](#imports)
- [Component Architecture](#component-architecture)
- [Hooks and Performance](#hooks-and-performance)
- [Custom Hooks](#custom-hooks)
- [TypeScript Discipline](#typescript-discipline)
- [State Management](#state-management)
- [Forms (Formik)](#forms-formik)
- [Logging](#logging)
- [Testing](#testing)
- [Feature Flags](#feature-flags)
- [Constants and Magic Strings](#constants-and-magic-strings)

---

## Styling: PatternFly-First Approach

Always use PatternFly components and layout primitives. Do not reach for raw HTML elements (`<div>`, `<section>`, `<header>`) or custom CSS for layout.

```tsx
// GOOD -- PatternFly layout
import { Flex, FlexItem, Title, Button } from '@patternfly/react-core';

const Header = () => (
  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
    <FlexItem><Title headingLevel="h1">Applications</Title></FlexItem>
    <FlexItem><Button variant="primary">Create</Button></FlexItem>
  </Flex>
);

// BAD -- raw HTML with custom CSS
const Header = () => (
  <div className="header-flex">
    <h1>Applications</h1>
    <button className="primary-btn">Create</button>
  </div>
);
```

Use PatternFly layout components for their intended purpose:

| Component | Use Case |
|---|---|
| `Flex` / `FlexItem` | Most layouts (row or column) |
| `Stack` / `StackItem` | Vertical stacking |
| `Split` / `SplitItem` | Two-column side-by-side |
| `Grid` / `GridItem` | Responsive grid layouts |
| `Gallery` / `GalleryItem` | Card grids |
| `Bullseye` | Centering content |
| `Level` / `LevelItem` | Horizontal alignment |

Use PatternFly design tokens (CSS custom properties) for spacing, color, and borders -- never hardcode values:

```scss
// GOOD
.my-component {
  padding: var(--pf-global--spacer--md);
  color: var(--pf-global--primary-color--100);
}

// BAD
.my-component {
  padding: 16px;
  color: #0066cc;
}
```

### When Custom CSS Is Acceptable

Custom CSS is acceptable only when:

1. **PatternFly does not provide a component or utility** for the exact need (e.g., a specialized layout for pipeline topology).
2. **Fixing a PatternFly bug** -- document the bug with a comment linking the PF issue.
3. **Animation or transition** that PF does not support.

When writing custom CSS:

- Place styles in a co-located SCSS file (e.g., `MyComponent.scss`) alongside the component.
- Use BEM naming: `.my-component__section--loading`.
- Use PF tokens for all values (spacing, color, borders).
- Never use inline styles (`style={{ ... }}`).

---

## Imports

Use absolute imports via the `~/` alias for all `src/` paths. Relative imports (`../../../`) are not allowed.

```tsx
// GOOD
import { ApplicationKind } from '~/types';
import { useApplications } from '~/hooks/useApplications';

// BAD
import { ApplicationKind } from '../../../types';
```

Import boundaries and ordering are enforced by CI via `.eslintrc.restrict-imports.cjs` and the `import/order` eslint rule.

---

## Component Architecture

### Single Responsibility

Each component must have one clear goal. If a component does multiple things, split it.

```tsx
// BAD -- component fetches data AND renders a complex table AND handles filtering
const ApplicationPage = () => {
  const [apps] = useApplications(namespace);
  const [filter, setFilter] = useState('');
  // ... 200 lines of mixed concerns
};

// GOOD -- separated concerns
const ApplicationPage = () => (
  <FilterProvider>
    <ApplicationListView />
  </FilterProvider>
);

const ApplicationListView = () => {
  const [apps, loaded] = useApplications(namespace);
  // Rendering only, filtering delegated to FilterContext
};
```

### Do Not Pass Entire Objects When Only a Few Properties Are Needed

Follow interface segregation. If a child component only needs `name` and `namespace`, do not pass the entire `ApplicationKind` object.

```tsx
// BAD
<ApplicationRow application={application} />
// inside ApplicationRow: uses only application.metadata.name and application.spec.displayName

// GOOD
<ApplicationRow name={application.metadata.name} displayName={application.spec.displayName} />
```

Exception: when the child genuinely needs most of the object's fields, passing the whole object is fine.

### Decomposition Signals

Split a component when:
- It exceeds ~200 lines.
- It has multiple `useEffect` calls serving different purposes.
- It renders conditionally based on more than two states.
- It couples data-fetching logic with presentation.

---

## Hooks and Performance

### useEffect

Do not use `useEffect` to derive state from props. That is what `useMemo` is for.

```tsx
// BAD -- useEffect + useState to compute derived value
const [filteredApps, setFilteredApps] = useState<ApplicationKind[]>([]);
useEffect(() => {
  setFilteredApps(apps.filter((a) => a.metadata.name.includes(filter)));
}, [apps, filter]);

// GOOD -- useMemo for derived computation
const filteredApps = useMemo(
  () => apps.filter((a) => a.metadata.name.includes(filter)),
  [apps, filter],
);
```

### useMemo

Use `useMemo` when:
- Computing a value from a large array (filtering, sorting, transforming).
- The result is passed as a prop to a memoized child or used in a dependency array.
- Creating a new object/array reference that would trigger unnecessary re-renders.

Do not use `useMemo` for:
- Simple property access or trivial expressions.
- String concatenation or basic arithmetic.

```tsx
// UNNECESSARY -- trivial computation
const title = useMemo(() => `${name} Details`, [name]);

// WARRANTED -- filtering a list
const visibleItems = useMemo(
  () => items.filter((item) => item.status === activeFilter),
  [items, activeFilter],
);
```

### useCallback

Use `useCallback` only when reference stability matters:

1. **Passed as a prop to a memoized child** (`React.memo`).
2. **Used in a dependency array** of `useEffect`, `useMemo`, or another `useCallback`.
3. **Returned from a custom hook** (callers rely on stable references).

```tsx
// GOOD -- passed to memoized child
const handleDelete = useCallback((id: string) => {
  deleteApplication(id);
}, [deleteApplication]);

return <MemoizedDeleteButton onDelete={handleDelete} />;

// UNNECESSARY -- only used in the same component's JSX with no memoized children
const handleClick = useCallback(() => {
  setOpen(true);
}, []);
// Just use a plain function:
const handleClick = () => setOpen(true);
```

### useRef for Mutable Values That Do Not Trigger Re-renders

Use `useRef` to store mutable values that should not cause re-renders (timers, previous values, DOM nodes).

```tsx
// Track previous value without re-render
const prevFilter = useRef(filter);
useEffect(() => {
  if (prevFilter.current !== filter) {
    trackFilterChange(filter);
    prevFilter.current = filter;
  }
}, [filter]);
```

### Referential Stability Through Render Loops

When a variable (object, array, function) is created inline and passed as a prop or dependency, it creates a new reference every render. This causes unnecessary re-renders or effect executions.

```tsx
// BAD -- new object every render
<Table columns={[{ title: 'Name' }, { title: 'Status' }]} />

// GOOD -- stable reference
const columns = useMemo(() => [{ title: 'Name' }, { title: 'Status' }], []);
<Table columns={columns} />
```

---

## Custom Hooks

### When to Create a Custom Hook

Create a custom hook when:
- Logic involves multiple hooks that are tightly coupled (e.g., a `useK8sWatchResource` + filtering + error handling).
- The same hook combination is repeated in 2+ components.
- A component's hook section exceeds ~15 lines.

### Custom Hook Design Rules

1. **Clear inputs and outputs.** Define typed parameters and return types.
2. **Single goal.** A hook named `useApplications` fetches applications. It does not also fetch components.
3. **Memoize returned objects, arrays, and functions.** Callers depend on reference stability.

```tsx
// BAD -- returns a new object every render
const useApplicationData = (namespace: string) => {
  const { data, isLoading, error } = useK8sWatchResource<ApplicationKind[]>(...);
  return { applications: data, isLoading, error }; // new object every render
};

// GOOD -- stable return via useMemo
const useApplicationData = (namespace: string) => {
  const { data, isLoading, error } = useK8sWatchResource<ApplicationKind[]>(...);
  return useMemo(
    () => ({ applications: data, isLoading, error }),
    [data, isLoading, error],
  );
};
```

4. **Always memoize functions returned from custom hooks.** Even if they seem cheap, callers may use them in dependency arrays.

```tsx
// BAD
const useFilter = (items: Item[]) => {
  const [filter, setFilter] = useState('');
  // applyFilter creates a new ref every render
  const applyFilter = (value: string) => setFilter(value);
  return { filteredItems: items.filter(...), applyFilter };
};

// GOOD
const useFilter = (items: Item[]) => {
  const [filter, setFilter] = useState('');
  const applyFilter = useCallback((value: string) => setFilter(value), []);
  const filteredItems = useMemo(
    () => items.filter((i) => i.name.includes(filter)),
    [items, filter],
  );
  return useMemo(
    () => ({ filteredItems, applyFilter }),
    [filteredItems, applyFilter],
  );
};
```

---

## TypeScript Discipline

Basic type safety (`no-explicit-any`, `no-unused-vars`, `exhaustive-deps`) is enforced by CI. The rules below require human judgment.

### Never Use `as` for Type Assertions

The `as` keyword silences TypeScript. Fix the actual type rather than casting.

```tsx
// BAD -- hides a potential bug
const app = data as ApplicationKind;

// GOOD -- narrow with a type guard
function isApplicationKind(data: unknown): data is ApplicationKind {
  return typeof data === 'object' && data !== null && 'spec' in data;
}
if (isApplicationKind(data)) {
  // data is ApplicationKind here
}
```

Exceptions: `as const` and `as unknown as TestType` in test mocks are acceptable.

### Optional Chaining Must Have Fallback Values

When using optional chaining (`?.`), provide a fallback via `??` where the result is rendered or passed to a function that cannot accept `undefined`.

```tsx
// BAD -- undefined silently flows into the component
<Title>{application?.metadata?.name}</Title>

// GOOD -- explicit fallback
<Title>{application?.metadata?.name ?? '-'}</Title>
```

### Optional Properties Must Be Genuinely Optional

Do not mark a property as optional (`?`) just to avoid a type error. If a value is always present at the call site, make it required.

```tsx
// BAD -- marked optional to dodge a type error in one caller
interface Props {
  namespace?: string; // actually always provided
}

// GOOD
interface Props {
  namespace: string;
}
```

---

## State Management

This project uses four state management approaches. Choose the right one:

| Approach | Use When |
|---|---|
| `useK8sWatchResource` (via `@tanstack/react-query` + WebSocket) | Fetching and watching Kubernetes resources |
| `@tanstack/react-query` (direct) | Non-K8s async data (tekton results, external APIs) |
| Zustand | Client-side global state (feature flags) |
| React Context | Scoped provider state (namespace, auth, filter context) |
| `useLocalStorage` hook (`~/shared/hooks/useLocalStorage`) | Persisting user preferences across sessions |

Do not use `useState` for server data. Do not use `localStorage` directly -- use the `useLocalStorage` hook from `~/shared/hooks/useLocalStorage`.

---

## Forms (Formik)

This project uses Formik with Yup validation. Follow these patterns:

- Wrap forms with `<Formik<FormValues>>` and define a typed `initialValues`.
- Use `useFormikContext<FormValues>()` in child components to access form state.
- Define validation schemas with Yup in a separate file or co-located constant.
- Use `formik-pf` components where applicable for PatternFly integration.

---

## Logging

Never use `console.log`, `console.warn`, `console.error`, or any `console.*` method directly. Use the `logger` service from `~/monitoring/logger`:

```tsx
import { logger } from '~/monitoring/logger';

logger.debug('Fetching applications', { namespace });
logger.info('Application created', { name });
logger.warn('Deprecated API used', { endpoint });
logger.error('Failed to fetch applications', error, { namespace });
```

When modifying an existing file that contains `console.*` statements, replace them with the appropriate `logger` method. When creating new files, always use `logger`.

---

## Testing

### Unit Tests

- Framework: **Jest** + **React Testing Library**.
- Test files: `__tests__/` directory alongside the code, with `.spec.ts` or `.spec.tsx` extension.
- Use rendering utilities from `~/unit-test-utils/` (e.g., `renderWithQueryClientAndRouter`, `namespaceRenderer`, `formikRenderer`).
- Use `createK8sWatchResourceMock` from `~/unit-test-utils/mock-k8s` for K8s resource mocks.
- Use semantic queries: `getByRole`, `getByLabelText`, `getByText`. Avoid `getByTestId`.
- Test success, error, and loading states.
- Follow Arrange-Act-Assert pattern.
- Run `yarn test` after every change.

### E2E Tests

- Framework: **Cypress** (in `e2e-tests/` directory, separate `package.json`).
- E2E tests run in CI with the `ok-to-test` label.
- Page objects live in `e2e-tests/support/pageObjects/`.
- Utility functions live in `e2e-tests/utils/`.

### Coverage

The project uses Codecov and targets at least **80% coverage**. PRs that significantly reduce coverage will be asked to add more tests.

---

## Feature Flags

Wrap incomplete or in-progress features behind feature flags. See [docs/feature-flags.md](./feature-flags.md) for the full guide.

- Use `<IfFeature flag="flagName">` for conditional rendering.
- Use `useIsOnFeatureFlag('flagName')` for conditional logic.
- Define new flags in `src/feature-flags/flags.ts`.
- Test flags via URL: `?ff=flagName` or `?ff_flagName=true`.
- Set `defaultEnabled: false` and `status: 'wip'` for new flags.

---

## Constants and Magic Strings

Do not use inline string or number literals for values that have semantic meaning. Define them in `src/consts/` or as a local constant.

```tsx
// BAD
if (pipelineRun.status === 'Succeeded') { ... }

// GOOD
import { PIPELINE_RUN_STATUS } from '~/consts/pipelinerun';
if (pipelineRun.status === PIPELINE_RUN_STATUS.SUCCEEDED) { ... }
```

When a mapping between types and values is needed, use a data-driven object/array instead of if/else chains:

```tsx
// BAD
const getStatusIcon = (status: string) => {
  if (status === 'Succeeded') return <CheckCircleIcon />;
  if (status === 'Failed') return <ExclamationCircleIcon />;
  if (status === 'Running') return <InProgressIcon />;
  return <UnknownIcon />;
};

// GOOD
const STATUS_ICONS: Record<string, React.ReactNode> = {
  Succeeded: <CheckCircleIcon />,
  Failed: <ExclamationCircleIcon />,
  Running: <InProgressIcon />,
};

const getStatusIcon = (status: string) => STATUS_ICONS[status] ?? <UnknownIcon />;
```
