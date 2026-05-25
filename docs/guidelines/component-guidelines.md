# Component Development Guidelines

This document defines the patterns and conventions for building new components in konflux-ui. Follow these patterns to ensure consistency across the codebase.

## Directory Structure

New components go in `src/components/<FeatureName>/`. Shared, reusable components go in `src/shared/components/`.

```
src/components/MyFeature/
  MyFeatureListView.tsx          # List page (table + filters)
  MyFeatureListRow.tsx           # Table row component
  MyFeatureListHeader.ts         # Column definitions + header factory
  MyFeatureDetailsView.tsx       # Detail page (tabs + breadcrumbs)
  MyFeatureForm.tsx              # Create/edit form
  MyFeatureOverviewTab.tsx       # Tab content
  my-feature-actions.ts          # Action menu builders
  my-feature-utils.ts            # Feature-specific utilities
  __tests__/
    MyFeatureListView.spec.tsx
    MyFeatureDetailsView.spec.tsx
  __data__/
    mock-my-feature.ts           # Test fixtures
```

## Import Rules

- Use absolute imports via `~/` alias (maps to `src/`).
- Use `@routes/` alias for route imports.
- Never use relative imports like `../../../`.
- Import PatternFly icons from deep ESM paths: `@patternfly/react-icons/dist/esm/icons/<kebab-case-name>`.
- Import lodash functions from `lodash-es/<funcName>`.
- Never use `console.*` -- use `logger` from `~/monitoring/logger`.

```tsx
// Correct
import { useComponents } from '~/hooks/useComponents';
import { ApplicationModel } from '~/models';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import sortBy from 'lodash-es/sortBy';

// Wrong
import { useComponents } from '../../../hooks/useComponents';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { sortBy } from 'lodash';
```

## Component Architecture Principles

### 1. Single Responsibility

Each component should do one thing. If a component handles data fetching, filtering, sorting, AND rendering, break it down.

### 2. No `as` Type Assertions

Never use TypeScript `as` casts except for:
- `as const` for literal types
- Test mocks (e.g., `useComponent as jest.Mock`)

Use type guards or fix the actual type instead.

### 3. No `useEffect` for Derived State

If you need to compute a value from props or other state, use `useMemo`:

```tsx
// Wrong
const [filteredItems, setFilteredItems] = useState([]);
useEffect(() => {
  setFilteredItems(items.filter(i => i.name.includes(search)));
}, [items, search]);

// Correct
const filteredItems = useMemo(
  () => items.filter(i => i.name.includes(search)),
  [items, search],
);
```

### 4. Memoize Custom Hook Returns

Any custom hook that returns objects, arrays, or functions MUST memoize them:

```tsx
// Correct
const useMyData = (namespace: string) => {
  const { data, isLoading, error } = useK8sWatchResource(...);

  const filtered = useMemo(
    () => data?.filter(item => !item.metadata?.deletionTimestamp) ?? [],
    [data],
  );

  return useMemo(
    () => [filtered, !isLoading, error] as const,
    [filtered, isLoading, error],
  );
};
```

### 5. `useCallback` Only When Reference Stability Matters

Use `useCallback` only when the function is:
- Passed as a prop to a memoized child
- Used in a dependency array
- Returned from a custom hook

```tsx
// Necessary: passed as dependency to useMemo in child
const handleSelect = useCallback((item: MyItem) => {
  setSelected(item.id);
}, []);

// Unnecessary: inline event handler in the same component
const handleClick = () => { setOpen(!open); };
```

### 6. PatternFly Components Over Raw HTML

Always use PatternFly layout components (`Flex`, `Stack`, `Bullseye`, `PageSection`) instead of raw `<div>`. See [patternfly-guidelines.md](./patternfly-guidelines.md) for details.

### 7. No Inline Styles (with rare exceptions)

Use co-located SCSS files with BEM naming. The only acceptable inline styles are PatternFly design token references:

```tsx
// Acceptable inline style (PF token)
<Flex style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }}>

// Not acceptable -- use SCSS instead
<div style={{ display: 'flex', gap: '8px', color: '#333' }}>
```

### 8. Constants for Magic Strings

Never use inline string literals for status values, label selectors, or storage keys. Define them in `src/consts/` or feature-local constants:

```tsx
// Wrong
if (status === 'Succeeded') { ... }
selector: { matchLabels: { 'appstudio.redhat.com/application': appName } }

// Correct
import { PipelineRunLabel } from '~/consts/pipelinerun';
if (status === RunStatus.Succeeded) { ... }
selector: { matchLabels: { [PipelineRunLabel.APPLICATION]: appName } }
```

### 9. Data-Driven Mappings Over If/Else Chains

```tsx
// Wrong
const getStatusIcon = (status: string) => {
  if (status === 'success') return <CheckIcon />;
  if (status === 'error') return <ErrorIcon />;
  if (status === 'pending') return <PendingIcon />;
  return <UnknownIcon />;
};

// Correct
const STATUS_ICONS: Record<string, React.ComponentType> = {
  success: CheckIcon,
  error: ErrorIcon,
  pending: PendingIcon,
};

const getStatusIcon = (status: string) => {
  const Icon = STATUS_ICONS[status] ?? UnknownIcon;
  return <Icon />;
};
```

### 10. Analytics in Components

Always use the `useTrackAnalyticsEvent()` hook. Never import `analyticsService` directly in components:

```tsx
import { useTrackAnalyticsEvent } from '~/analytics/hooks';

const MyComponent = () => {
  const track = useTrackAnalyticsEvent();

  return (
    <AnalyticsButton
      analytics={{ link_name: 'my-button', app_name: applicationName }}
      onClick={handleClick}
    >
      Click me
    </AnalyticsButton>
  );
};
```

### 11. RBAC-Gated Actions

Use `useAccessReviewForModel` from `~/utils/rbac` for permission-gated actions:

```tsx
import { useAccessReviewForModel } from '~/utils/rbac';
import { ComponentModel } from '~/models';

const [canCreateComponent, accessLoaded] = useAccessReviewForModel(ComponentModel, 'create');

// In actions
const actions: Action[] = [
  {
    id: 'create-component',
    label: 'Add component',
    cta: () => navigate(createPath),
    disabled: !canCreateComponent,
    disabledTooltip: 'You do not have permission to create components',
  },
];
```

## State Management Guide

| Data Type | Tool | Example |
|---|---|---|
| K8s resources (live watch) | `useK8sWatchResource` from `~/k8s` | Components, PipelineRuns |
| Server data (REST/API) | React Query (`@tanstack/react-query`) | Tekton Results, namespaces |
| Global client state | Zustand stores | Background task status |
| Scoped UI state | React Context | Filter state, modal state |
| Persistent preferences | `useLocalStorage` from `~/shared/hooks/useLocalStorage` | Theme, dismissed cards |

## File Naming Conventions

| File Type | Pattern | Example |
|---|---|---|
| Component | PascalCase | `MyComponent.tsx` |
| Hook | camelCase with `use` prefix | `useMyData.ts` |
| Utility | kebab-case | `my-feature-utils.ts` |
| Test | Same as source + `.spec` | `MyComponent.spec.tsx` |
| Test data | Same directory pattern | `__data__/mock-my-feature.ts` |
| Styles | Same as component | `MyComponent.scss` |
| Constants | kebab-case | `my-feature-consts.ts` |
| Types | kebab-case or in component file | `types.ts` |

## TypeScript Strictness

- `noUnusedLocals` and `noUnusedParameters` are enforced.
- Prefix intentionally unused params with `_`: `(_event, value) => ...`
- Never suppress these with `// @ts-ignore`. Fix the code.
