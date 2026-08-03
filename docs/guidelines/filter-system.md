# Filter System Guide

This document explains how to use the config-driven filter system in `src/shared/components/Filter/`. It replaces the per-view boilerplate of `FilterContextProvider` + `useFilterContext` + manual filter application.

## Architecture Overview

The filter system is a three-piece pipeline:

```
defineFilters()        Config definition (type-safe, compile-time)
       |
       v
useFilterState()       URL state (read/write via nuqs v2)
       |
       v
useFilteredData()      Client-side filtering (single-pass AND logic)
       |
       v
FilterToolbar          UI rendering (controls generated from config)
```

**Key principles:**

- **Config-driven:** A single config array defines the URL params, filter types, predicates, and UI controls
- **URL-first:** All filter state lives in URL search parameters via [nuqs v2](https://nuqs.47ng.com/), making filters shareable and bookmarkable
- **Separation of concerns:** URL reading (`useFilterState`) is decoupled from data filtering (`useFilteredData`), allowing API-side filters to bypass client filtering

**Location:** `src/shared/components/Filter/`

## Setup: NuqsAdapter

The filter system requires a `NuqsAdapter` wrapper somewhere above your filter components. This bridges nuqs with React Router v6.

### App Root

```tsx
import { NuqsAdapter } from '~/shared/components/Filter';

// In your route component or tab wrapper:
const MyTab = () => (
  <NuqsAdapter>
    <MyListView />
  </NuqsAdapter>
);
```

### Tests

Tests must use `NuqsTestingAdapter` from nuqs:

```tsx
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

render(
  <NuqsTestingAdapter searchParams="?name=foo&status=%5B%22active%22%5D">
    <MyFilteredComponent />
  </NuqsTestingAdapter>,
);
```

## Filter Config Types

### `search` — Text Search

Debounced text search with a `SearchInput` control.

```ts
{
  type: 'search',
  param: 'name',              // URL parameter name
  label: 'Name',              // Display label
  placeholder: 'Search...',   // Optional, defaults to "Filter by {label}..."
  debounce: 600,              // Optional, defaults to 600ms
  filterFn: (item, value) =>  // Optional, defaults to textMatch on metadata.name
    textMatch(item.metadata.name, value),
}
```

**URL shape:** `?name=search+text` (plain string)

**Default filterFn:** When omitted, falls back to `textMatch(item.metadata.name, value)`. Provide a custom `filterFn` for non-K8s data or different fields.

### `multiSelect` — Multi-Value Checkbox Select

Dropdown with checkboxes. Multiple values can be active simultaneously.

```ts
{
  type: 'multiSelect',
  param: 'status',
  label: 'Status',
  filterFn: (item, selectedValues) =>  // Required
    selectedValues.includes(item.status.phase),
}
```

**URL shape:** `?status=%5B%22Succeeded%22%2C%22Failed%22%5D` (JSON array)

### `singleSelect` — Single-Value Dropdown

Only one value can be active. Clicking the same value deselects it (toggle-off).

```ts
{
  type: 'singleSelect',
  param: 'type',
  label: 'Type',
  filterFn: (item, selectedValue) =>  // Required
    item.spec.type === selectedValue,
}
```

**URL shape:** `?type=build` (plain string)

### `boolean` — Switch Toggle

Renders a PatternFly `Switch`. Boolean filters are **excluded from client-side filtering** — they are consumed directly by components or API calls.

```ts
{
  type: 'boolean',
  param: 'showArchived',
  label: 'Show Archived',
}
```

**URL shape:** `?showArchived=true` (removed from URL when `false`)

**Important:** Boolean filters do not have a `filterFn` and are not included in `clientFilterValues`. Read them from `filterValues` and handle them manually (e.g., passing to an API query or applying custom filtering logic).

### `switchableSearch` — Field Picker + Search

Combines a dropdown (to select which field to search) with a debounced text input. Each field has its own URL parameter.

```ts
{
  type: 'switchableSearch',
  param: 'searchField',       // Stores the active field selection
  label: 'Search',
  debounce: 600,              // Optional, defaults to 600ms
  fields: [
    {
      label: 'Name',
      value: 'name',
      param: 'name',          // Each field gets its own URL param
      filterFn: (item, value) => textMatch(item.metadata.name, value),
    },
    {
      label: 'Commit',
      value: 'commit',
      param: 'commitMsg',
      filterFn: (item, value) => textMatch(item.metadata.annotations?.title ?? '', value),
    },
  ],
}
```

**URL shape:** `?searchField=commit&commitMsg=fix+bug`

Switching fields clears the previous field's URL param and focuses the search input.

## `defineFilters<T>()`

Type-safe config builder. Uses currying to bind the data type and `as const` for full literal-type inference.

```ts
import { defineFilters } from '~/shared/components/Filter';

const filterConfigs = defineFilters<PipelineRun>()([
  { type: 'search', param: 'name', label: 'Name' },
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    filterFn: (item, values) => values.includes(item.status.phase),
  },
  { type: 'boolean', param: 'showArchived', label: 'Show Archived' },
] as const);
```

The `as const` assertion is critical — it enables TypeScript to infer the exact literal types for `param` names, which powers type-safe access to `filterValues.name`, `filterValues.status`, etc.

### Inferred Types

- `FilterValues<C>` — Record of `{ [param]: valueType }` for every filter, including boolean and API-mode
- `ClientFilterValues<C>` — Same but excludes `boolean` and `mode: 'api'` filters

## Hooks

### `useFilterState(configs)`

Reads all filter values from URL parameters. Filter controls write their own params via nuqs; this hook reads them all.

```tsx
import { useFilterState } from '~/shared/components/Filter';

const { filterValues, clientFilterValues, isFiltered, clearAll } = useFilterState(filterConfigs);
```

**Returns:**

| Property             | Type                    | Description                                                           |
| -------------------- | ----------------------- | --------------------------------------------------------------------- |
| `filterValues`       | `FilterValues<C>`       | All filter values including boolean and API-mode                      |
| `clientFilterValues` | `ClientFilterValues<C>` | Subset for client-side filtering (excludes boolean and `mode: 'api'`) |
| `isFiltered`         | `boolean`               | `true` when any filter has a non-default value                        |
| `clearAll`           | `() => void`            | Resets every filter parameter to `null`, removing them from the URL   |

### `useFilteredData(configs, data, clientFilterValues)`

Pure client-side filtering. URL-unaware — receives pre-read values and returns the filtered subset.

```tsx
import { useFilteredData } from '~/shared/components/Filter';

const { filteredData } = useFilteredData(filterConfigs, allItems, clientFilterValues);
```

**Behavior:**

- Skips `boolean` and `mode: 'api'` configs
- For `search` without a `filterFn`, falls back to `textMatch(item.metadata.name, value)`
- All active predicates are combined with **AND logic** — an item must pass every active filter
- Returns the full `data` array when no filters are active (zero-copy)

### Filter Mode

Each filter config supports a `mode` property:

| Mode       | Default | Behavior                                                                                       |
| ---------- | ------- | ---------------------------------------------------------------------------------------------- |
| `'client'` | Yes     | Filter applied by `useFilteredData` in the browser                                             |
| `'api'`    | No      | Value available in `filterValues` but excluded from `clientFilterValues` and `useFilteredData` |

Use `mode: 'api'` when the filter value should be sent to a server-side query:

```ts
{
  type: 'search',
  param: 'name',
  label: 'Name',
  mode: 'api',  // Read from filterValues.name, pass to your API hook
}
```

## Controls

Each filter type has a corresponding control component. You rarely use these directly — `FilterToolbar` renders them from the config.

### `SearchFilter`

Debounced `SearchInput`. Maintains local state for responsiveness while debouncing URL updates.

### `MultiSelectFilter`

PatternFly `Select` with checkboxes. Selected values stored as JSON array in URL. Chips displayed via `ToolbarFilter` and can be individually removed.

### `SingleSelectFilter`

PatternFly `Select` where only one value can be active. Clicking the same value deselects it.

### `BooleanFilter`

PatternFly `Switch`. Stores `true`/`false` in URL. When unchecked, the parameter is removed from the URL entirely.

### `SwitchableSearchFilter`

Field-picker dropdown + debounced `SearchInput`. Each field has its own URL param. Switching fields clears the previous field's value.

## `FilterToolbar`

Renders a PatternFly `Toolbar` with filter controls generated from a config array. Includes a "Clear all filters" action.

```tsx
import { FilterToolbar } from '~/shared/components/Filter';

<FilterToolbar configs={filterConfigs} options={{ status: statusOptions }}>
  <Button>Create</Button>
</FilterToolbar>;
```

### Props

| Prop       | Type                           | Required | Description                                                                              |
| ---------- | ------------------------------ | -------- | ---------------------------------------------------------------------------------------- |
| `configs`  | `readonly FilterConfig<T>[]`   | Yes      | Filter configuration array                                                               |
| `options`  | `Record<string, OptionItem[]>` | No       | Dropdown options keyed by filter `param`. Required for `multiSelect` and `singleSelect`. |
| `children` | `ReactNode`                    | No       | Extra toolbar items rendered after filter controls (e.g., action buttons)                |

The `options` prop is a map from filter `param` to an array of `OptionItem` values. Use the `buildOptions` or `buildOptionsWithFallback` utilities to generate these from your data.

## Utilities

### `buildOptions(data, keyExtractor, opts?)`

Extracts unique option values from a data array, deduplicates, and returns sorted `FilterOption[]` objects.

```ts
import { buildOptions } from '~/shared/components/Filter';

const statusOptions = buildOptions(pipelineRuns, (r) => r.status.phase);
// [{ label: 'Failed', value: 'Failed' }, { label: 'Succeeded', value: 'Succeeded' }]
```

**Options:**

- `validKeys?: string[]` — Restrict output to only these values
- `labelFormatter?: (value: string) => string` — Custom label formatting (default: capitalize first letter)

### `buildOptionsWithFallback(data, keyExtractor, undefinedLabel)`

Like `buildOptions` but appends a synthetic "none" option when any item's key is `null` or `undefined`. A visual divider separates the regular options from the fallback.

```ts
import { buildOptionsWithFallback, NONE_VALUE } from '~/shared/components/Filter';

const options = buildOptionsWithFallback(runs, (r) => r.status, 'No status');
// [
//   { label: 'Failed', value: 'Failed' },
//   { label: 'Succeeded', value: 'Succeeded' },
//   { type: 'divider' },
//   { label: 'No status', value: '__none__' },
// ]

// In your filterFn, match the NONE_VALUE sentinel:
filterFn: (item, values) =>
  values.includes(item.status ?? NONE_VALUE),
```

## Usage Patterns

### 1. Simple Text Search

The simplest filter setup — just a search box:

```tsx
import {
  defineFilters,
  useFilterState,
  useFilteredData,
  FilterToolbar,
} from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { textMatch } from '~/utils/text-filter-utils';

const filterConfigs = defineFilters<MyItem>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    filterFn: (item, value) => textMatch(item.metadata.name, value),
  },
] as const);

const MyListView = () => {
  const [items, loaded] = useMyItems();
  const { clientFilterValues, clearAll } = useFilterState(filterConfigs);
  const { filteredData } = useFilteredData(filterConfigs, items, clientFilterValues);

  return (
    <TableContainer
      data={filteredData}
      unfilteredData={items}
      loaded={loaded}
      emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
      noDataState={<EmptyState>No items</EmptyState>}
      toolbar={<FilterToolbar configs={filterConfigs} />}
    >
      <Table data={filteredData} columns={columns} getRowId={(r) => r.id} aria-label="Items" />
    </TableContainer>
  );
};
```

### 2. Full-Featured Filters

Search + multi-select + boolean:

```tsx
const filterConfigs = defineFilters<PipelineRun>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    filterFn: (item, value) => textMatch(item.metadata.name, value),
  },
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    filterFn: (item, values) => values.includes(item.status.phase),
  },
  {
    type: 'boolean',
    param: 'showArchived',
    label: 'Show Archived',
  },
] as const);

const MyListView = () => {
  const { filterValues, clientFilterValues, clearAll, isFiltered } =
    useFilterState(filterConfigs);

  // Boolean filter controls data fetching (not client filtering)
  const { data, isLoading } = usePipelineRuns({
    includeArchived: filterValues.showArchived,
  });

  const { filteredData } = useFilteredData(filterConfigs, data ?? [], clientFilterValues);

  const statusOptions = React.useMemo(
    () => buildOptions(data ?? [], (r) => r.status.phase),
    [data],
  );

  return (
    <TableContainer
      data={filteredData}
      unfilteredData={data ?? []}
      loaded={!isLoading}
      emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
      toolbar={
        <FilterToolbar
          configs={filterConfigs}
          options={{ status: statusOptions }}
        />
      }
    >
      <Table ... />
    </TableContainer>
  );
};
```

### 3. Switchable Search

Search across multiple fields with a field picker:

```tsx
const filterConfigs = defineFilters<Snapshot>()([
  {
    type: 'switchableSearch',
    param: 'searchField',
    label: 'Search',
    fields: [
      {
        label: 'Name',
        value: 'name',
        param: 'name',
        filterFn: (item, value) => textMatch(item.metadata.name, value),
      },
      {
        label: 'Commit message',
        value: 'commitMessage',
        param: 'commitMessage',
        filterFn: (item, value) =>
          textMatch(item.metadata.annotations?.['commit-title'] ?? '', value),
      },
    ],
  },
] as const);
```

### 4. API-Side Filters

When a boolean filter controls server-side data fetching rather than client-side filtering:

```tsx
const filterConfigs = defineFilters<Snapshot>()([
  {
    type: 'switchableSearch',
    param: 'searchField',
    label: 'Search',
    fields: [
      {
        label: 'Name',
        value: 'name',
        param: 'name',
        filterFn: (item, v) => textMatch(item.metadata.name, v),
      },
    ],
  },
  {
    type: 'boolean',
    param: 'releasable',
    label: 'Show only releasable snapshots',
  },
] as const);

const MyListView = () => {
  const { filterValues, clientFilterValues } = useFilterState(filterConfigs);

  // Boolean value drives the API call, not client filtering
  const { data } = useMyQuery({ enableArchive: !filterValues.releasable });

  // useFilteredData only applies client-side filters (search)
  const { filteredData } = useFilteredData(filterConfigs, data ?? [], clientFilterValues);

  // Additional manual filtering for other boolean filters
  const finalData = React.useMemo(
    () =>
      filteredData.filter((item) => {
        if (filterValues.showMergedOnly && item.eventType === 'pull') return false;
        return true;
      }),
    [filteredData, filterValues.showMergedOnly],
  );
};
```

## Testing

### Required Adapter

All tests using filter hooks or controls must wrap the component in `NuqsTestingAdapter`:

```tsx
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

it('filters by name', () => {
  render(
    <NuqsTestingAdapter searchParams="?name=my-item">
      <MyFilteredList />
    </NuqsTestingAdapter>,
  );

  expect(screen.getByText('my-item')).toBeInTheDocument();
});
```

### Testing Filter Behavior

```tsx
import { defineFilters } from '~/shared/components/Filter/types';
import { useFilterState } from '~/shared/components/Filter/hooks/useFilterState';

const configs = defineFilters<MyItem>()([
  { type: 'search', param: 'name', label: 'Name' },
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    filterFn: (item, values) => values.includes(item.status),
  },
] as const);

const TestHarness = () => {
  const { filterValues, isFiltered, clearAll } = useFilterState(configs);
  return (
    <div>
      <span data-test="name">{filterValues.name}</span>
      <span data-test="isFiltered">{String(isFiltered)}</span>
      <button data-test="clear" onClick={clearAll}>
        Clear
      </button>
    </div>
  );
};

it('reads URL params', () => {
  render(
    <NuqsTestingAdapter searchParams="?name=foo">
      <TestHarness />
    </NuqsTestingAdapter>,
  );
  expect(screen.getByTestId('name')).toHaveTextContent('foo');
  expect(screen.getByTestId('isFiltered')).toHaveTextContent('true');
});
```

## Integration with TableV2

The filter system and [TableV2](./table-v2.md) are designed to work together. The typical wiring:

```
defineFilters()
       |
useFilterState() -----> filterValues (for API/boolean filters)
       |                 clientFilterValues (for client filters)
       |                 clearAll (for empty state + toolbar)
       v
useFilteredData() ----> filteredData
       |
       v
<TableContainer
  data={filteredData}
  unfilteredData={rawData}
  toolbar={<FilterToolbar configs={...} />}
  emptyState={<FilteredEmptyState onClear={clearAll} />}
>
  <Table data={filteredData} ... />
</TableContainer>
```

**Key points:**

- `TableContainer` uses `unfilteredData` to distinguish "no data at all" from "no filter matches"
- Pass `clearAll` to your empty state's clear action
- Conditionally render the toolbar only when there's data or active filters

## DO / DON'T

| DO                                                           | DON'T                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Use `as const` with `defineFilters`                          | Omit `as const` (loses type inference for `filterValues`)    |
| Wrap with `NuqsAdapter` at the route/tab level               | Wrap individual filter components                            |
| Use `NuqsTestingAdapter` in tests                            | Use `NuqsAdapter` in tests (requires a real router)          |
| Pass `clientFilterValues` to `useFilteredData`               | Pass `filterValues` to `useFilteredData` (includes booleans) |
| Handle boolean filters manually                              | Expect boolean filters to appear in `clientFilterValues`     |
| Use `buildOptions` to generate dropdown options              | Hardcode option arrays (they go stale)                       |
| Provide `options` prop to `FilterToolbar` for select filters | Forget options (renders empty dropdowns)                     |
