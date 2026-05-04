---
name: screenshot
description: >
  Take screenshots, capture UI, screenshot component, 
  render component screenshot, preview UI state,
  show me what this looks like
---

# UI Screenshot Capture Skill

Capture screenshots of React components in various states using the project's Vite + Playwright harness. Works standalone (for previewing/debugging) or as part of PR creation.

## When to use

- User asks to see what a component looks like
- User asks to take/capture screenshots of a component
- User wants to preview UI changes
- Called from the `create-pr` skill during Step 4a

## Prerequisites

Ensure the Playwright browser is installed:

```
yarn screenshots:install
```

This is a one-time step per machine. If the capture script fails with "Executable doesn't exist", run this command.

## Critical constraint

You may ONLY create or modify files under `scripts/screenshots/tmp/`. Do NOT modify `capture.ts`, `harness.tsx`, `vite.config.ts`, or any file under `scripts/screenshots/mocks/`. If capture fails, report the error and stop -- do not attempt to fix infrastructure files.

## Flow

### 1 -- Identify the target component

Determine which component to screenshot. This can come from:
- User explicitly naming a component ("screenshot the ApplicationListView")
- The current file/context in the conversation
- A git diff (when called from `create-pr`)

Prefer **page-level or view-level components** over small sub-components:
- Render `ApplicationListView` rather than `ApplicationListRow`
- Render `PipelineRunDetailsView` rather than `PipelineRunHeader`

This gives a realistic view of the full UI context.

### 2 -- Analyze what changed (diff-aware)

If there is a git diff available (PR context or modified files), read it first:

```
git diff origin/main -- <changed-files>
```

Identify the **specific visual change**:
- New table column? New button? Layout change?
- Modified empty/error/loading state?
- Changed data display format?

This determines what scenarios to capture. Do NOT skip this step.

### 3 -- Research the component's data dependencies

Read the component source and its imports to understand:
- What hooks does it call? (`useK8sWatchResource` via `useApplications`, `useComponents`, etc.)
- What K8s resource kinds does it fetch? (e.g., `Application`, `Component`)
- What props does it receive?
- Does it read route params or context?

Then look for existing mock data to reuse:
1. **Component test files**: `src/components/<Feature>/__tests__/*.spec.tsx` -- see how tests mock data and what data shapes they use
2. **Component-local test data**: `src/components/<Feature>/__data__/` -- e.g., `mock-data.ts`
3. **Shared test data**: `src/__data__/` -- e.g., `pipelinerun-data.ts`

Import and reuse existing mock data whenever possible. The test files are the best reference for realistic data shapes.

### 4 -- Choose meaningful scenarios

**Base scenarios on what the diff actually touches**, not on a generic template.

Examples by change type:

| Change type | Good scenarios | Bad scenarios |
|---|---|---|
| New table column | Populated table showing the new column with varied data in rows | loading, empty, error (unchanged) |
| New button | View with button enabled; view with button disabled | loading (unrelated) |
| Error handling change | The specific error state that changed | populated (unchanged) |
| New empty state | The new empty state view | loading, error (unchanged) |
| Full new component | populated, empty (and loading/error only if they have custom UI) | generic loading spinner |

Rules:
- **Always include** the primary happy-path state with realistic data
- **Only include loading/empty/error** if those code paths were modified in the diff, or if the user explicitly requests them
- When called standalone (not from diff), capture the state the user asks for
- Use **multiple rows with varied data** in list views -- a table with zero rows is useless

### 5 -- Write the render file

Write a render file to `scripts/screenshots/tmp/render-<descriptive-name>.tsx`.

#### Structure

```typescript
import React from 'react';
import { MyComponent } from '~/components/Feature/MyComponent';
import { setScreenshotState } from '../types';

export const scenarios = [
  {
    id: 'unique-kebab-case-id',
    label: 'Human-readable description',
    render: () => {
      setScreenshotState({
        k8sResources: {
          ResourceKind: { data: mockData, isLoading: false },
        },
      });
      return <MyComponent />;
    },
  },
];
```

Each scenario needs:
- `id` (string) -- used in screenshot filename, must be unique within the file
- `label` (string) -- description shown to the user
- `render` (function) -- sets mock state, then returns a React element

**Import style**: Check whether the component uses `export default` or named exports. Most view components use `export default`, so import them with `import MyComponent from '~/...'`, not `import { MyComponent } from '~/...'`. If unsure, check the barrel `index.ts` for `export { default as ... }` patterns.

#### Automatic provider wrappers

The harness automatically wraps each scenario with:
- `BrowserRouter` (react-router-dom)
- `QueryClientProvider` (tanstack/react-query)
- `NamespaceContext.Provider` (with namespace `test-ns`)
- `ModalProvider` (modal context for action menus)
- `FilterContextProvider` (filter toolbar context with `filterParams={['name']}`)
- PatternFly CSS (all core stylesheets)
- React error boundary (catches and displays render errors)

Do **not** add these in the render file.

#### Mocking data via `setScreenshotState`

The harness uses a Vite plugin that redirects `useK8sWatchResource` and RBAC hooks to pre-built mocks. These mocks read from `window.__screenshotState`. Use the typed `setScreenshotState` helper from `../types` to set mock data:

```typescript
import { setScreenshotState } from '../types';

setScreenshotState({
  k8sResources: {
    // Key = the K8s resource kind (matches groupVersionKind.kind)
    Application: {
      data: [...],       // array for list watches, single object for get watches
      isLoading: false,  // true to simulate loading state
      error: undefined,  // set to simulate error state
    },
    Component: {
      data: [...],
      isLoading: false,
    },
  },
});
```

**Important**: Call this inside each scenario's `render()` function, before returning JSX. Each scenario can have completely different mock data.

RBAC hooks (`useAccessReviewForModel`, `useAccessReview`) are automatically mocked to return `[true, true]` (allowed, loaded). No configuration needed.

#### Simulating error states

Use `HttpError.fromCode()` for error scenarios -- components check `error.code`:

```typescript
import { HttpError } from '~/k8s/error';
import { setScreenshotState } from '../types';

render: () => {
  setScreenshotState({
    k8sResources: {
      Application: {
        data: [],
        isLoading: false,
        error: HttpError.fromCode(500),
      },
    },
  });
  return <MyComponent />;
},
```

#### Full working example (ApplicationListView with new column)

This example shows how to screenshot a table component where a "New column" was added. It creates varied mock data so the column displays different values:

```typescript
import React from 'react';
import ApplicationListView from '~/components/Applications/ApplicationListView';
import { ApplicationKind } from '~/types';
import { setScreenshotState } from '../types';

const mockApplications: ApplicationKind[] = [
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Application',
    metadata: {
      name: 'frontend-app',
      namespace: 'test-ns',
      uid: 'uid-1',
      creationTimestamp: '2024-06-01T10:00:00Z',
      resourceVersion: '100',
    },
    spec: { displayName: 'Frontend Application' },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Application',
    metadata: {
      name: 'api-svc',
      namespace: 'test-ns',
      uid: 'uid-2',
      creationTimestamp: '2024-05-15T08:30:00Z',
      resourceVersion: '101',
    },
    spec: { displayName: 'API' },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Application',
    metadata: {
      name: 'worker-service',
      namespace: 'test-ns',
      uid: 'uid-3',
      creationTimestamp: '2024-04-20T14:00:00Z',
      resourceVersion: '102',
    },
    spec: { displayName: 'Background Worker Service' },
  },
];

const mockComponents = [
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'fe-component',
      namespace: 'test-ns',
      uid: 'comp-1',
      creationTimestamp: '2024-06-01T10:00:00Z',
      resourceVersion: '200',
    },
    spec: { application: 'frontend-app', componentName: 'fe-component', source: {} },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'fe-component-2',
      namespace: 'test-ns',
      uid: 'comp-2',
      creationTimestamp: '2024-06-02T10:00:00Z',
      resourceVersion: '201',
    },
    spec: { application: 'frontend-app', componentName: 'fe-component-2', source: {} },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'api-component',
      namespace: 'test-ns',
      uid: 'comp-3',
      creationTimestamp: '2024-05-15T09:00:00Z',
      resourceVersion: '202',
    },
    spec: { application: 'api-svc', componentName: 'api-component', source: {} },
  },
];

export const scenarios = [
  {
    id: 'populated-with-new-column',
    label: 'Application list showing the new column with varied values',
    render: () => {
      setScreenshotState({
        k8sResources: {
          Application: { data: mockApplications, isLoading: false },
          Component: { data: mockComponents, isLoading: false },
        },
      });
      return <ApplicationListView />;
    },
  },
];
```

Note how the mock data includes:
- **Multiple rows** with varied `displayName` lengths (some > 6 chars, some <= 6) to exercise the new column's conditional logic
- **Component data** for the components column to render correctly
- **Realistic metadata** (timestamps, UIDs, resource versions)

### 6 -- Run the capture script

```
npx tsx scripts/screenshots/capture.ts --render-file ./tmp/render-<name>.tsx --prefix <prefix>
```

Options:
- `--render-file` (required): path to the render file, relative to `scripts/screenshots/`
- `--prefix`: prefix for output filenames (default: `screenshot`)
- `--width`: viewport width in px (default: `1280`)
- `--height`: viewport height in px (default: `900`)

Output: JSON array of `{ scenarioId, label, filePath }` printed to stdout. Screenshot PNGs are saved to `scripts/screenshots/tmp/`.

### 7 -- Present results

Show the user:
- The list of captured screenshots with their file paths and labels
- The label describes what the screenshot shows and what to look for — include it so the user can verify correctness without opening every file
- If in a terminal that supports it, mention they can open the files directly

If the user wants to iterate (different states, different component), go back to step 4 or 5.

## Detecting what wrappers a component needs

When reading the component source in Step 3, use these heuristics to decide what extra setup is needed in the render file. Check for each signal in the component **and its immediate children/imports**.

### Route params (`useParams`)

**Signal**: Component or its children import `useParams` from `react-router-dom`.

**Fix**: Wrap in `<Routes><Route>` with a path matching the real route. Check `src/routes/paths.ts` for the correct pattern. Set the browser URL to match:

```typescript
import { Routes, Route } from 'react-router-dom';

render: () => {
  window.history.pushState({}, '', '/ns/test-ns/applications/my-app');
  setScreenshotState({ ... });
  return (
    <Routes>
      <Route path="/ns/:workspaceName/applications/:applicationName" element={<MyComponent />} />
    </Routes>
  );
},
```

**How to find the path**: Search `src/routes/paths.ts` for the component name or feature name. The param names are defined in `src/routes/utils.ts` (`RouterParams` type). Common ones: `workspaceName`, `applicationName`, `componentName`, `pipelineRunName`, `taskRunName`, `releaseName`, `snapshotName`, `integrationTestName`, `commitName`.

### Formik context (`useField`, `useFormikContext`)

**Signal**: Component imports `useField`, `useFormikContext`, or `FieldArray` from `formik`.

**Fix**: Check if the component renders its own `<Formik>` internally (most `*FormPage`, `*Modal`, and `*View` form components do). If yes, render it directly. If the component is a **sub-component** of a form (e.g. a section or field group), wrap it in `<Formik>`:

```typescript
import { Formik } from 'formik';

render: () => {
  return (
    <Formik initialValues={...} onSubmit={() => {}}>
      <MyFormSubComponent />
    </Formik>
  );
},
```

**How to find initialValues**: Look at the parent component that renders `<Formik>`, or check the component's test file for the mock values used there. The form type is usually defined in a nearby `types.ts` or `form-utils.ts`.

### Feature flags (`useIsOnFeatureFlag`, `IfFeature`)

**Signal**: Component imports `useIsOnFeatureFlag` from `~/feature-flags/hooks` or uses the `<IfFeature>` wrapper.

**Fix**: Enable the relevant flag before rendering:

```typescript
import { FeatureFlagsStore } from '~/feature-flags/store';

render: () => {
  FeatureFlagsStore.set('flag-name', true);
  setScreenshotState({ ... });
  return <MyComponent />;
},
```

**How to find the flag name**: It's the string argument to `useIsOnFeatureFlag('...')` or the `flag` prop on `<IfFeature flag="...">`. All flag keys are defined in `src/feature-flags/flags.ts`.

### Non-K8s data fetches (`useQuery` with non-K8s endpoints)

**Signal**: Component or its hooks import `useQuery`/`useInfiniteQuery` from `@tanstack/react-query` directly (not through `useK8sWatchResource`), or use hooks like `useIssues`, `useTRPipelineRuns`, `useTRTaskRuns`, `useConformaResult`.

**Impact**: These fetch from `/plugins/kite/...`, `/plugins/tekton-results/...`, or pod log URLs. The harness mock does NOT intercept these — they will hang or fail.

**Fix options**:
1. Prefer screenshotting a **parent list view** that only uses `useK8sWatchResource` rather than a detail view that fetches logs/results.
2. If you must render such a component, the query will stay in loading state (which may be acceptable for a screenshot of other parts of the UI).
3. If the non-K8s data is essential, skip the component and tell the user why.

### SidePanelContext

**Signal**: Component imports from `~/components/SidePanel/SidePanelContext`.

**Impact**: The context has a no-op default (`setProps: () => {}, close: () => {}`), so it usually works fine without wrapping. Only wrap with `SidePanelHost` if you need to screenshot the panel in its open state.

### Custom FilterContext params

**Signal**: The component's corresponding route file wraps it with `<FilterContextProvider filterParams={[...]}>`  and uses filters beyond just `name`.

**Impact**: The harness provides `filterParams={['name']}`. If the component's toolbar uses additional filter types (check for `useFilterContext` or `FilterToolbar` imports), filters beyond `name` won't sync to URL.

**Fix**: Wrap with your own `FilterContextProvider` if filter state matters for the screenshot:
```typescript
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';

render: () => {
  return (
    <FilterContextProvider filterParams={['name', 'status', 'type']}>
      <MyListView />
    </FilterContextProvider>
  );
},
```

### Things that are safe (no action needed)

- **`useNavigate` / `useLocation` / `Link`**: Work fine with the harness's `BrowserRouter`.
- **`useNamespace` / `useNamespaceInfo`**: Harness provides `NamespaceContext` with `namespace: 'test-ns'`.
- **`useModalLauncher`**: Harness provides `ModalProvider`.
- **Analytics** (`useTrackAnalyticsEvent`): No-ops gracefully without initialization.
- **Logger**: Uses `console.*`, no setup needed.
- **RBAC hooks**: Automatically mocked to return `[true, true]`.
- **`useTaskStore` (Zustand)**: Starts empty, only affects background task indicators.

## Troubleshooting

1. **"Executable doesn't exist"**: Run `yarn screenshots:install` to download Chromium.
2. **Import error**: Check that `~/` and `@routes/` paths resolve. The Vite config mirrors the project aliases.
3. **CSS missing**: PatternFly core CSS is loaded by the harness. Component-specific SCSS is imported by the component itself.
4. **Timeout (15s)**: A component is waiting for data that wasn't mocked. Check `window.__screenshotState` has the right resource kind keys.
5. **Wrong data shape**: Check existing `__data__/` files and test specs for the correct TypeScript types.
6. **"render error" in screenshot**: The error boundary caught an exception. Read the error text for details -- usually a missing context provider or unmocked hook.
7. **Table shows headers but no rows**: The table uses virtualization that requires a parent scroll container. The harness provides one (`overflow: auto` on `#harness-ready`). If this still happens, the component may need a specific layout wrapper.
8. **"Cannot read properties of undefined (reading 'getFieldProps')"**: Formik context missing. See "Formik context" heuristic above.
9. **"useParams" returns undefined**: Route params not provided. See "Route params" heuristic above.
10. **Feature flag gated content not showing**: Flag not enabled. See "Feature flags" heuristic above.

## How mocking works (reference)

The Vite config (`scripts/screenshots/vite.config.ts`) includes a `screenshotMocks` plugin that uses `resolveId` to redirect specific module imports to pre-built mocks:

| Original module | Mock file | What it does |
|---|---|---|
| `src/k8s/hooks/useK8sWatchResource.ts` | `mocks/k8s.ts` | Returns data from `window.__screenshotState.k8sResources[kind]` |
| `src/utils/rbac.ts` | `mocks/rbac.ts` | All RBAC checks return `[true, true]` (allowed) |

This works transparently through barrel re-exports. When `useApplications` imports `useK8sWatchResource` from `~/k8s`, the import chain resolves to `src/k8s/hooks/useK8sWatchResource.ts`, which the plugin redirects to the mock. The higher-level hook's filtering/sorting logic still runs on the mock data, producing realistic output.

## Identifying which K8s kinds to mock

The `kind` key in `setScreenshotState.k8sResources` must match the `groupVersionKind.kind` field used by the hook. To find what kinds a component needs:

1. **Read the component's hook calls** — e.g. `useApplications()`, `useComponents()`, `usePipelineRuns()`
2. **Follow the hook to its `useK8sWatchResource` call** — the `groupVersionKind` object has a `kind` field (e.g. `ApplicationModel` has `kind: 'Application'`)
3. **Or check the test file** — look for `useK8sWatchResource` mock return values in `*.spec.tsx`; the mock setup keys map 1:1 to what you need

The mock matches by `kind` string, so provide every kind the component fetches. Missing kinds will return empty arrays (for lists) or null (for single resources).
