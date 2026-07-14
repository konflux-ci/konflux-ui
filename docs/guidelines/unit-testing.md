# Unit Testing Guide

This document covers testing patterns, utilities, and conventions for writing unit tests in konflux-ui.

## Quick Reference

| Task | Command |
|---|---|
| Run all tests | `yarn test` |
| Run single file | `yarn test -- path/to/file.spec.tsx` |
| Run with coverage | `yarn coverage` |

## Test File Conventions

- **Location**: `__tests__/` directories alongside source files
- **Extension**: `.spec.ts` or `.spec.tsx`
- **Test data**: `__data__/` directories alongside `__tests__/`
- **Test ID attribute**: `data-test` (configured via `configure({ testIdAttribute: 'data-test' })`)
- **No snapshot tests**

## Framework Stack

- **Jest** with SWC transform (`.swcrc`)
- **React Testing Library** (RTL)
- **jsdom** test environment
- `@testing-library/jest-dom` for DOM matchers
- `userEvent` for user interactions

## Rendering Utilities

Import from `~/unit-test-utils/`:

| Utility | Use When |
|---|---|
| `renderWithQueryClientAndRouter` | Component needs BrowserRouter + QueryClientProvider (most common) |
| `renderWithQueryClient` | Component needs only QueryClientProvider (no routing) |
| `routerRenderer` | Component needs only BrowserRouter |
| `formikRenderer` | Component uses Formik fields |
| `namespaceRenderer` | Component uses `useNamespace()` via context |

```tsx
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';

it('should render the component', () => {
  renderWithQueryClientAndRouter(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### When to Use Which Renderer

```tsx
// Most components -- router + query client
renderWithQueryClientAndRouter(<MyListView />);

// Form fields that read from Formik context
formikRenderer(<MyFormField />, { fieldName: 'initial value' });

// Components that only need useNamespace()
namespaceRenderer(<MyComponent />, 'test-namespace');

// Hook tests with React Query
const { result } = renderHook(() => useMyHook(), {
  wrapper: ({ children }) =>
    React.createElement(QueryClientProvider, { client: createTestQueryClient() }, children),
});
```

## Mock Utilities

All mock utilities are in `~/unit-test-utils/`. The key utilities:

### K8s Resource Mocks

```tsx
import { createK8sWatchResourceMock, createK8sUtilMock } from '~/unit-test-utils';

// Module-scope: creates a jest.fn() and spies on useK8sWatchResource
const useK8sWatchResourceMock = createK8sWatchResourceMock();

it('should render resources', () => {
  // Accepts [data, loaded, error] tuple (legacy format)
  useK8sWatchResourceMock.mockReturnValue([mockResources, true, undefined]);
  renderWithQueryClientAndRouter(<MyComponent />);
  expect(screen.getByText(mockResources[0].metadata.name)).toBeInTheDocument();
});

it('should show loading state', () => {
  useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
  renderWithQueryClientAndRouter(<MyComponent />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

it('should show error state', () => {
  useK8sWatchResourceMock.mockReturnValue([[], true, { code: 404 }]);
  renderWithQueryClientAndRouter(<MyComponent />);
  expect(screen.getByText('404: Page not found')).toBeInTheDocument();
});

// Mock a K8s mutation function (e.g., k8sCreate, k8sDelete)
const k8sCreateMock = createK8sUtilMock('K8sQueryCreateResource');
```

### Namespace Mocks

```tsx
import { mockUseNamespaceHook } from '~/unit-test-utils';

describe('MyComponent', () => {
  // Call at describe level -- auto-resets in beforeEach
  mockUseNamespaceHook('test-namespace');

  it('should use the namespace', () => {
    renderWithQueryClientAndRouter(<MyComponent />);
    // Component now sees namespace = 'test-namespace'
  });
});
```

### Router Mocks

```tsx
import { createUseParamsMock, createReactRouterMock } from '~/unit-test-utils';

// Mock useParams
const useParamsMock = createUseParamsMock({ applicationName: 'my-app' });

// Mock useNavigate
const useNavigateMock = createReactRouterMock('useNavigate');
const navigateMock = jest.fn();
useNavigateMock.mockReturnValue(navigateMock);
```

### RBAC Mocks

```tsx
import { mockAccessReviewUtil } from '~/unit-test-utils';

// Mock a specific RBAC check
mockAccessReviewUtil('useAccessReviewForModel', [true, true]); // [isAllowed, loaded]

// Mock as denied
mockAccessReviewUtil('useAccessReviewForModel', [false, true]);
```

### Analytics Mocks

```tsx
import { mockAnalyticsServiceFn } from '~/unit-test-utils';

const trackMock = mockAnalyticsServiceFn('track');
```

### Application Hooks

```tsx
import { createUseApplicationMock } from '~/unit-test-utils';

// At describe level -- returns mock function for per-test overrides
const useApplicationMock = createUseApplicationMock([mockApp, true, null]);
```

## Global Mocks (Pre-configured in jest.setup.js)

These modules are auto-mocked with `jest.requireActual` passthrough. You can spy on them without additional `jest.mock()` calls:

- `src/k8s`
- `react-router-dom`
- `src/shared/providers/Namespace/useNamespaceInfo`
- `src/utils/rbac`
- `src/hooks/useApplications`
- `src/hooks/useKonfluxPublicInfo`
- `src/kubearchive/fetch-utils`

```tsx
// No jest.mock() call needed for these -- just spy directly
jest.spyOn(k8s, 'useK8sWatchResource').mockReturnValue(/* ... */);

// Or use the convenience utilities
const mock = createK8sWatchResourceMock(); // wraps the spy setup
```

## Testing Patterns

### Pattern 1: Test Three States (Loading, Error, Loaded)

Every data-driven component should test all three states:

```tsx
describe('MyComponent', () => {
  const watchMock = createK8sWatchResourceMock();
  mockUseNamespaceHook('test-ns');

  it('should show loading spinner', () => {
    watchMock.mockReturnValue([[], false, undefined]);
    renderWithQueryClientAndRouter(<MyComponent />);
    screen.getByRole('progressbar');
  });

  it('should show error state', () => {
    watchMock.mockReturnValue([[], true, { code: 500, message: 'Server error' }]);
    renderWithQueryClientAndRouter(<MyComponent />);
    screen.getByText('Server error');
  });

  it('should render data', () => {
    watchMock.mockReturnValue([mockData, true, undefined]);
    renderWithQueryClientAndRouter(<MyComponent />);
    expect(screen.getByText(mockData[0].metadata.name)).toBeInTheDocument();
  });
});
```

### Pattern 2: User Interactions with userEvent

Use `userEvent.setup()` for multi-step interactions. Use `fireEvent` only for simple synchronous events.

```tsx
it('should open action menu and click delete', async () => {
  const user = userEvent.setup();
  renderWithQueryClientAndRouter(<MyComponent />);

  // Open kebab menu
  await user.click(screen.getByRole('button', { name: /Actions/i }));

  // Click menu item
  await user.click(screen.getByRole('menuitem', { name: /Delete/i }));

  expect(deleteHandler).toHaveBeenCalled();
});
```

### Pattern 3: Form Testing

```tsx
it('should submit the form with correct values', async () => {
  const user = userEvent.setup();
  const createMock = createK8sUtilMock('K8sQueryCreateResource');
  createMock.mockResolvedValue({});

  renderWithQueryClientAndRouter(<MyFormView />);

  await user.type(screen.getByLabelText('Name'), 'my-resource');
  await user.click(screen.getByRole('button', { name: 'Create' }));

  expect(createMock).toHaveBeenCalledWith(
    expect.objectContaining({
      metadata: expect.objectContaining({ name: 'my-resource' }),
    }),
  );
});
```

### Pattern 4: Testing with Formik

```tsx
import { formikRenderer } from '~/unit-test-utils';

it('should render the field with initial value', () => {
  formikRenderer(<MyDropdownField name="type" />, { type: 'build' });
  expect(screen.getByText('build')).toBeInTheDocument();
});
```

### Pattern 5: Hook Testing

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '~/unit-test-utils';

describe('useMyHook', () => {
  const watchMock = createK8sWatchResourceMock();

  it('should return filtered data', () => {
    watchMock.mockReturnValue([mockData, true, undefined]);
    const { result } = renderHook(() => useMyHook('test-ns'));
    const [data, loaded, error] = result.current;
    expect(data).toHaveLength(2);
    expect(loaded).toBe(true);
  });
});
```

### Pattern 6: Async Hook Testing with React Query

```tsx
describe('useMyQueryHook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient(); // Fresh client per test
    jest.clearAllMocks();
  });

  it('should return data when query succeeds', async () => {
    mockFetchFn.mockResolvedValue({ items: mockItems });

    const { result } = renderHook(() => useMyQueryHook('test-ns'), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.data).toEqual(mockItems);
  });
});
```

### Pattern 7: Debounced Input Testing

```tsx
jest.useFakeTimers();

it('should filter after debounce', () => {
  const view = renderWithQueryClientAndRouter(<MyFilteredList />);

  act(() => {
    fireEvent.change(screen.getByPlaceholderText('Filter by name...'), {
      target: { value: 'search-term' },
    });
  });

  act(() => {
    jest.advanceTimersByTime(700); // Advance past debounce timeout
  });

  view.rerender(<MyFilteredList />);
  expect(screen.getByText('search-term-match')).toBeInTheDocument();
});
```

### Pattern 8: Table Component Testing

When testing table views, mock `TableComponent` to avoid virtualization issues:

```tsx
jest.mock('~/shared/components/table/TableComponent', () => {
  return (props) => (
    <PfTable role="table" aria-label="table" variant="compact" borders={false}>
      <Tbody>
        {props.data.map((d, i) => (
          <Tr key={i}>
            <MyListRow columns={[]} obj={d} />
          </Tr>
        ))}
      </Tbody>
    </PfTable>
  );
});
```

### Pattern 9: Feature Flag Testing

```tsx
jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

it('should show feature when flag is enabled', () => {
  mockUseIsOnFeatureFlag.mockReturnValue(true);
  renderWithQueryClientAndRouter(<MyComponent />);
  expect(screen.getByText('New Feature')).toBeInTheDocument();
});
```

## Query Conventions

### Prefer Semantic Queries

Use queries in this priority order:

1. `getByRole` -- buttons, links, headings, menu items
2. `getByLabelText` -- form fields
3. `getByText` -- visible text content
4. `getByTestId` -- last resort (uses `data-test` attribute)

```tsx
// Preferred
screen.getByRole('button', { name: /Create/i });
screen.getByRole('link', { name: /my-resource/i });
screen.getByLabelText('Name');
screen.getByText('No results found');

// Acceptable when no semantic alternative exists
screen.getByTestId('my-custom-widget');
```

### Assertion Conventions

```tsx
// Element exists (throws if not found -- implicit assertion)
screen.getByRole('button', { name: /Submit/i });

// Element does not exist
expect(screen.queryByText('Error')).not.toBeInTheDocument();

// PatternFly disabled buttons use aria-disabled, not disabled attribute
expect(screen.getByRole('button', { name: /Delete/i }))
  .toHaveAttribute('aria-disabled', 'true');

// Waiting for loading to finish
import { waitForLoadingToFinish } from '~/unit-test-utils';
await waitForLoadingToFinish(); // waits for role="progressbar" to disappear

// Async assertions with waitFor
await waitFor(() => {
  expect(result.current.isLoaded).toBe(true);
});

// Partial argument matching
expect(mockFn).toHaveBeenCalledWith(
  expect.objectContaining({ metadata: expect.objectContaining({ name: 'test' }) }),
);
```

## Common Pitfalls

### 1. Not clearing mocks between tests

Always reset mock state:

```tsx
afterEach(() => {
  jest.clearAllMocks();
});
```

Or use the describe-level mock utilities (e.g., `mockUseNamespaceHook`) which set up `beforeEach` resets automatically.

### 2. Using `fireEvent` for complex interactions

`fireEvent` dispatches events synchronously and doesn't simulate browser behavior. Use `userEvent.setup()` for anything beyond simple change/click events. `fireEvent` is acceptable for simple synchronous events such as `fireEvent.change` on a debounced input with fake timers (see [Pattern 7](#pattern-7-debounced-input-testing)). The [PR review checklist](../pr-review-guidelines.md#3-testing) follows the same standard.

### 3. Forgetting to flush async state

For hooks with React Query, always `await waitFor(...)` before asserting on async results. For debounced inputs, use `jest.useFakeTimers()` + `jest.advanceTimersByTime()`.

### 4. Stale QueryClient between tests

Always create a fresh `QueryClient` in `beforeEach` when testing hooks that use React Query:

```tsx
let queryClient: QueryClient;
beforeEach(() => {
  queryClient = createTestQueryClient();
});
```

### 5. Testing PF disabled state with wrong attribute

PatternFly uses `aria-disabled="true"` instead of the HTML `disabled` attribute:

```tsx
// Wrong
expect(button).toBeDisabled();

// Correct for PF buttons with isAriaDisabled
expect(button).toHaveAttribute('aria-disabled', 'true');
```

### 6. Not using `act()` for state updates

When using fake timers or triggering state updates outside RTL's render cycle:

```tsx
act(() => {
  jest.advanceTimersByTime(500);
});
```

## Mock Data Conventions

Store mock data in `__data__/` directories:

```tsx
// __data__/mock-my-feature.ts
import { MyFeatureKind } from '~/types/my-feature';

export const mockMyFeature: MyFeatureKind = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'MyFeature',
  metadata: {
    name: 'test-feature',
    namespace: 'test-namespace',
    uid: 'test-uid',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {
    // ...
  },
};

export const mockMyFeatureList: MyFeatureKind[] = [
  mockMyFeature,
  { ...mockMyFeature, metadata: { ...mockMyFeature.metadata, name: 'test-feature-2', uid: 'uid-2' } },
];
```
