# TableV2 Component Guide

This document explains how to build list views using the new `TableV2` system in `src/shared/components/TableV2/`. It replaces the legacy table system documented in [table-component.md](./table-component.md).

## Why TableV2?

The legacy table in `src/shared/components/table/` uses `react-virtualized` (unmaintained) and the deprecated PatternFly v4 table API. TableV2 is built on:

- **[@tanstack/react-table](https://tanstack.com/table/latest) v8** — headless table logic (sorting, column visibility, expansion)
- **[@tanstack/react-virtual](https://tanstack.com/virtual/latest) v3** — lightweight row virtualization
- **PatternFly 5 composable table** — `Table`, `Thead`, `Tbody`, `Tr`, `Th`, `Td` components

The key design principle is **composable hooks + sub-components** orchestrated by a single `Table` component.

## Architecture Overview

```
<TableContainer>                         -- state machine (loading/error/empty/data)
  +-- toolbar (optional)                 -- FilterToolbar, action buttons
  +-- <Table>                            -- main orchestrator
      +-- useColumnState()               -- persistence, schema migration
      +-- useResponsiveColumns()         -- breakpoint-based column hiding
      +-- useTable()                     -- TanStack Table instance
      +-- useVirtualization()            -- @tanstack/react-virtual
      +-- useInfiniteScroll()            -- scroll-triggered data fetching
      +-- computeColumnWidths()          -- flex/fixed width calculation
      |
      +-- <PfTable>                      -- PatternFly composable table
          +-- <TableHeader>              -- sort indicators, column widths
          +-- <TableBody>                -- virtualized rows + spacers
              +-- <TableRow>             -- single row via flexRender
```

## Component Reference

### `Table`

The main orchestrator. Composes hooks and sub-components into a full-featured table.

**Import:** `import { Table } from '~/shared/components/TableV2';`

```tsx
<Table data={items} columns={columns} getRowId={(row) => row.metadata.uid} aria-label="My items" />
```

#### Props (`TableProps<TData>`)

| Prop                  | Type                           | Required | Description                                                      |
| --------------------- | ------------------------------ | -------- | ---------------------------------------------------------------- |
| `data`                | `TData[]`                      | Yes      | Array of row data to display                                     |
| `columns`             | `ColumnDefinition<TData>[]`    | Yes      | Column definitions                                               |
| `getRowId`            | `(row: TData) => string`       | Yes      | Stable unique row ID                                             |
| `aria-label`          | `string`                       | Yes      | Accessible label for the table element                           |
| `meta`                | `Record<string, unknown>`      | No       | Arbitrary metadata passed to TanStack's `table.options.meta`     |
| `enableSorting`       | `boolean`                      | No       | Enable client-side column sorting                                |
| `enableExpansion`     | `boolean`                      | No       | Enable expandable rows                                           |
| `expandedContent`     | `(row: TData) => ReactNode`    | No       | Render function for expanded row content                         |
| `hasNextPage`         | `boolean`                      | No       | Whether more data is available for infinite scroll               |
| `isFetchingNextPage`  | `boolean`                      | No       | Whether next page is currently loading                           |
| `fetchNextPage`       | `() => void`                   | No       | Callback to fetch the next page                                  |
| `columnStateKey`      | `string`                       | No       | localStorage key for persisting column state                     |
| `columnState`         | `ColumnState`                  | No       | Externally managed column state (overrides internal state)       |
| `onColumnStateChange` | `(state: ColumnState) => void` | No       | Callback when column state changes (required with `columnState`) |
| `scrollElement`       | `HTMLElement \| null`          | No       | External scroll container for virtualization                     |

### `TableContainer`

State machine wrapper that renders the correct content based on loading, error, and data conditions.

**Import:** `import { TableContainer } from '~/shared/components/TableV2';`

```tsx
<TableContainer
  data={filteredData}
  unfilteredData={allData}
  loaded={!isLoading}
  loadError={error}
  emptyState={<FilteredEmptyState onClear={clearFilters} />}
  noDataState={<EmptyState>No items yet</EmptyState>}
  toolbar={<FilterToolbar configs={filterConfigs} />}
>
  <Table data={filteredData} columns={columns} ... />
</TableContainer>
```

#### Resolution Order

| Priority | Condition                     | Renders                                                    |
| -------- | ----------------------------- | ---------------------------------------------------------- |
| 1        | `!loaded`                     | `skeleton` prop (default: `<TableSkeleton columns={3} />`) |
| 2        | `loadError`                   | Error message                                              |
| 3        | `unfilteredData.length === 0` | `noDataState` (no resources exist at all)                  |
| 4        | `data.length === 0`           | `emptyState` (resources exist but filters match nothing)   |
| 5        | Otherwise                     | `children` (the table)                                     |

The `toolbar` is **always** rendered regardless of state.

### `TableBody`

Renders the virtualized table body. Only rows visible in the viewport (plus overscan) are rendered. Top and bottom spacer `<Tr>` elements maintain correct scroll height. Shows skeleton rows when `isFetchingNextPage` is `true`.

### `TableHeader`

Renders the header row with column labels, computed widths, and PatternFly sort indicators for sortable columns.

### `TableRow`

Renders a single row with cells via TanStack's `flexRender`. Sets `dataLabel` on each `<Td>` for PatternFly's responsive table behavior.

### `TableSkeleton`

Loading placeholder that mimics the shape of a table with PatternFly `Skeleton` bars.

```tsx
<TableSkeleton columns={4} rows={10} />
```

### `GroupHeader`

Standalone collapsible group header row for grouped tables. Renders the group name and row count with an expand/collapse toggle.

```tsx
<GroupHeader
  groupId="failed"
  groupName="Failed"
  rowCount={3}
  visibleColumnCount={5}
  isExpanded={true}
  onToggle={() => toggleGroup('failed')}
/>
```

## Hook Reference

### `useColumnState(key, columns)`

Manages column visibility, order, and sort state with optional localStorage persistence.

```tsx
import { useColumnState } from '~/shared/components/TableV2';

// Persisted (survives unmount/refresh)
const { columnState, setColumnState } = useColumnState('my-table', columns);

// Ephemeral (resets on unmount)
const { columnState, setColumnState } = useColumnState(undefined, columns);
```

**Schema migration:** When column definitions change (columns added or removed), persisted state is automatically migrated:

- Stale column IDs are removed, preserving persisted order
- New column IDs are appended at the end
- Sort is cleared if the sorted column was removed

#### `ColumnState` Shape

```ts
interface ColumnState {
  /** Ordered list of visible column IDs. Order = display order. */
  visibleColumns: string[];
  /** ID of the currently sorted column, if any. */
  sortColumn?: string;
  /** Sort direction. */
  sortDirection?: 'asc' | 'desc';
}
```

### `useTable(options)`

Core hook that wraps TanStack's `useReactTable` with TableV2 conventions.

```tsx
import { useTable, type UseTableOptions } from '~/shared/components/TableV2';

const { table, rows } = useTable({
  data,
  columns,
  getRowId: (row) => row.id,
  columnState,
  setColumnState,
  responsiveColumnVisibility: columnVisibility,
  enableSorting: true,
});
```

Handles:

- Mapping `ColumnDefinition` to TanStack `ColumnDef`
- Merging user visibility (from `ColumnState`) with responsive visibility
- Applying column order from `ColumnState.visibleColumns`
- Deriving `SortingState` from `ColumnState`
- Conditionally enabling sorted/expanded row models

### `useResponsiveColumns(columns)`

Tracks viewport breakpoints via `window.matchMedia` and returns a column visibility map based on each column's `visibleFrom` setting.

```tsx
import { useResponsiveColumns } from '~/shared/components/TableV2';

const { columnVisibility } = useResponsiveColumns(columns);
// { status: true, details: false }
```

Only registers listeners for breakpoints actually used by the columns.

### `useVirtualization(options)`

Wraps `@tanstack/react-virtual`'s `useVirtualizer` with sensible defaults.

```tsx
import { useVirtualization } from '~/shared/components/TableV2';

const { virtualizer, virtualRows } = useVirtualization({
  count: rows.length,
  scrollElement: containerRef.current,
  estimateSize: 44, // default
  overscan: 10, // default
});
```

Uses `measureElement` for dynamic row height measurement.

### `useInfiniteScroll(options)`

Triggers data fetching when the user scrolls near the bottom of a virtualized list.

```tsx
import { useInfiniteScroll } from '~/shared/components/TableV2';

useInfiniteScroll({
  virtualizer,
  hasNextPage: !!query.hasNextPage,
  isFetchingNextPage: query.isFetchingNextPage,
  fetchNextPage: query.fetchNextPage,
  threshold: 5, // default: trigger 5 rows from the end
});
```

Guards against double-fetch via the `isFetchingNextPage` flag.

## Column Definition API

Columns are defined using the `ColumnDefinition<TData>` interface:

```tsx
import { type ColumnDefinition } from '~/shared/components/TableV2';

const columns: ColumnDefinition<MyItem>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.metadata.name,
    cell: (info) => <Link to={`/items/${info.getValue()}`}>{info.getValue() as string}</Link>,
    size: 3,
    sortable: true,
    nonHidable: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => row.status.phase,
    size: 1,
    visibleFrom: 'md',
  },
  {
    id: 'actions',
    header: '',
    accessorFn: () => null,
    width: '48px',
    pinned: 'end',
    nonHidable: true,
    cell: (info) => <ActionMenu actions={getActions(info.row.original)} />,
  },
];
```

### Property Reference

| Property         | Type                                      | Required | Description                                                   |
| ---------------- | ----------------------------------------- | -------- | ------------------------------------------------------------- |
| `id`             | `string`                                  | Yes      | Unique column identifier. Must be stable across renders.      |
| `header`         | `string \| ReactNode`                     | Yes      | Column header label                                           |
| `accessorFn`     | `(row: TData) => unknown`                 | Yes      | Extracts the cell value from a row                            |
| `cell`           | `(info: CellContext<TData>) => ReactNode` | No       | Custom cell renderer                                          |
| `size`           | `number`                                  | No       | Flex proportion for column width (default: `1`)               |
| `width`          | `string`                                  | No       | Fixed CSS width (e.g. `'120px'`, `'8rem'`). Overrides `size`. |
| `sortable`       | `boolean`                                 | No       | Whether the column supports sorting (default: `false`)        |
| `sortFn`         | `SortingFn<TData>`                        | No       | Custom sorting function                                       |
| `visibleFrom`    | `Breakpoint`                              | No       | Responsive breakpoint at which the column becomes visible     |
| `nonHidable`     | `boolean`                                 | No       | Prevents users from hiding this column via column management  |
| `pinned`         | `'start' \| 'end'`                        | No       | Pins the column to the start or end of the table              |
| `enableResizing` | `boolean`                                 | No       | Reserved for future use                                       |
| `filterFn`       | `FilterFn<TData>`                         | No       | Reserved for future use                                       |

> **Why `accessorFn` only?** `accessorKey` is intentionally not supported because row data in this codebase is often a Kubernetes resource with deeply nested or computed fields. An explicit function avoids type mismatches and keeps column definitions self-documenting.

### Breakpoint Values

| Breakpoint | Min Width |
| ---------- | --------- |
| `sm`       | 576px     |
| `md`       | 768px     |
| `lg`       | 992px     |
| `xl`       | 1200px    |
| `2xl`      | 1450px    |

## Column Widths

Columns use a dual-mode width system managed by `computeColumnWidths`:

### Flex Proportional (default)

Columns without `width` share available space in proportion to their `size` values. A column with `size: 3` gets three times the space of a column with `size: 1`.

```tsx
{ id: 'name', size: 3, ... }   // gets 60% when total flex size is 5
{ id: 'status', size: 1, ... } // gets 20%
{ id: 'date', size: 1, ... }   // gets 20%
```

### Fixed Width

Columns with `width` are excluded from the flex calculation and rendered at the exact CSS width.

```tsx
{ id: 'actions', width: '48px', ... }  // always 48px, flex columns share the rest
```

## Column State & Persistence

### Internal State (with localStorage)

Pass a `columnStateKey` to persist column visibility, order, and sort:

```tsx
<Table
  columnStateKey="pipeline-runs-table"
  columns={columns}
  ...
/>
```

### External State Management

For views that need to share column state with other components (e.g. column management modal):

```tsx
const { columnState, setColumnState } = useColumnState('my-table', columns);

// Pass to Table
<Table
  columnState={columnState}
  onColumnStateChange={setColumnState}
  ...
/>

// Pass to ColumnManagementModal
showModal(columnManagementModalLauncher({
  columns: columnInfoForModal,
  columnState,
  defaultColumnState,
  onSave: setColumnState,
}));
```

## Column Management

The `ColumnManagementModal` lets users reorder and show/hide columns via drag-and-drop. The `ColumnManagementButton` trigger is automatically hidden when there are 6 or fewer columns.

### Wiring It Up

```tsx
import { useColumnState, type ColumnState } from '~/shared/components/TableV2';
import ColumnManagementButton from '~/components/Filter/components/ColumnManagementButton';
import { columnManagementModalLauncher } from '~/components/modal/ColumnManagementModal';
import { useModalLauncher } from '~/components/modal/ModalProvider';

const MyListView = () => {
  const showModal = useModalLauncher();
  const { columnState, setColumnState } = useColumnState('my-table', columns);

  // Default state for the "Restore defaults" button
  const defaultColumnState: ColumnState = React.useMemo(
    () => ({ visibleColumns: columns.map((c) => c.id) }),
    [columns],
  );

  // Column metadata for the modal (strips out accessorFn, cell, etc.)
  const columnInfoForModal = React.useMemo(
    () => columns.map((c) => ({
      id: c.id,
      header: typeof c.header === 'string' ? c.header : c.id,
      nonHidable: c.nonHidable,
      pinned: c.pinned,
    })),
    [columns],
  );

  const openColumnManagement = React.useCallback(() => {
    showModal(
      columnManagementModalLauncher({
        columns: columnInfoForModal,
        columnState,
        defaultColumnState,
        onSave: setColumnState,
      }),
    );
  }, [showModal, columnInfoForModal, columnState, defaultColumnState, setColumnState]);

  return (
    <TableContainer
      toolbar={
        <FilterToolbar configs={filterConfigs}>
          <ColumnManagementButton onClick={openColumnManagement} totalColumns={columns.length} />
        </FilterToolbar>
      }
      ...
    >
      <Table
        columnState={columnState}
        onColumnStateChange={setColumnState}
        ...
      />
    </TableContainer>
  );
};
```

**Key behaviors:**

- Pinned columns (`pinned: 'start'` or `'end'`) cannot be dragged or hidden
- `nonHidable` columns have a disabled checkbox
- "Restore defaults" resets to the original column order and visibility

## Usage Patterns

### 1. Minimal Table

The simplest possible table with no sorting, no persistence, no infinite scroll:

```tsx
import { Table, TableContainer, type ColumnDefinition } from '~/shared/components/TableV2';

const columns: ColumnDefinition<MyItem>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name },
  { id: 'email', header: 'Email', accessorFn: (row) => row.email },
];

const MyListView = () => {
  const { data, isLoading } = useMyData();

  return (
    <TableContainer
      data={data ?? []}
      unfilteredData={data ?? []}
      loaded={!isLoading}
      noDataState={<EmptyState>No items</EmptyState>}
    >
      <Table data={data ?? []} columns={columns} getRowId={(row) => row.id} aria-label="My items" />
    </TableContainer>
  );
};
```

### 2. Full-Featured Table

Sorting, infinite scroll, column persistence, column management, filtering:

```tsx
import {
  Table,
  TableContainer,
  useColumnState,
  type ColumnDefinition,
  type ColumnState,
} from '~/shared/components/TableV2';
import {
  defineFilters,
  useFilterState,
  useFilteredData,
  FilterToolbar,
} from '~/shared/components/Filter';

const filterConfigs = defineFilters<MyItem>()([
  { type: 'search', param: 'name', label: 'Name' },
] as const);

const MyListView = () => {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useMyData();
  const { clientFilterValues, clearAll, isFiltered } = useFilterState(filterConfigs);
  const { filteredData } = useFilteredData(filterConfigs, data ?? [], clientFilterValues);

  const columns: ColumnDefinition<MyItem>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorFn: (r) => r.name,
      size: 3,
      sortable: true,
      nonHidable: true,
    },
    { id: 'status', header: 'Status', accessorFn: (r) => r.status, size: 1, visibleFrom: 'md' },
    { id: 'created', header: 'Created', accessorFn: (r) => r.createdAt, size: 2, sortable: true },
    {
      id: 'actions',
      header: '',
      accessorFn: () => null,
      width: '48px',
      pinned: 'end',
      nonHidable: true,
    },
  ];

  const { columnState, setColumnState } = useColumnState('my-table', columns);

  return (
    <TableContainer
      data={filteredData}
      unfilteredData={data ?? []}
      loaded={!isLoading}
      emptyState={<FilteredEmptyState onClear={clearAll} />}
      noDataState={<EmptyState>No items yet</EmptyState>}
      toolbar={
        isFiltered || (data ?? []).length > 0 ? (
          <FilterToolbar configs={filterConfigs} />
        ) : undefined
      }
    >
      <Table
        data={filteredData}
        columns={columns}
        getRowId={(row) => row.id}
        aria-label="My items"
        enableSorting
        columnState={columnState}
        onColumnStateChange={setColumnState}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </TableContainer>
  );
};
```

### 3. Column Definition Patterns

```tsx
// Sortable column with custom cell
{
  id: 'name',
  header: 'Name',
  accessorFn: (row) => row.metadata.name,
  cell: (info) => <Link to={`/items/${info.getValue()}`}>{info.getValue() as string}</Link>,
  sortable: true,
  size: 3,
}

// Pinned action column with fixed width
{
  id: 'actions',
  header: '',
  accessorFn: () => null,
  width: '48px',
  pinned: 'end',
  nonHidable: true,
  cell: (info) => <ActionMenu actions={getActions(info.row.original)} />,
}

// Responsive column (hidden below md breakpoint)
{
  id: 'details',
  header: 'Details',
  accessorFn: (row) => row.spec.description,
  visibleFrom: 'md',
}

// Column with custom sort function
{
  id: 'status',
  header: 'Status',
  accessorFn: (row) => row.status.phase,
  sortable: true,
  sortFn: (rowA, rowB) => {
    const priority = { Succeeded: 0, Running: 1, Failed: 2 };
    return (priority[rowA.original.status.phase] ?? 3) - (priority[rowB.original.status.phase] ?? 3);
  },
}
```

## Migration from Legacy Table

| Legacy (`src/shared/components/table/`)        | TableV2 (`src/shared/components/TableV2/`)                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `createTableHeaders(columns)`                  | `ColumnDefinition[]` array                                                        |
| `Row` component as `React.FC<RowFunctionArgs>` | `cell` function on each column definition                                         |
| `<TableData className={...}>`                  | Automatic `<Td>` via `flexRender`                                                 |
| `pf-m-width-*` CSS classes                     | `size` (flex proportion) or `width` (fixed CSS)                                   |
| `FilterContextProvider` + `useFilterContext`   | `useFilterState` + `useFilteredData` (see [filter-system.md](./filter-system.md)) |
| `useSortedResources` + sort index state        | `enableSorting` + `sortable` on columns                                           |
| `StatusBox` empty state logic                  | `TableContainer` with explicit `emptyState`/`noDataState`                         |
| `isInfiniteLoading` + `infiniteLoaderProps`    | `hasNextPage` + `isFetchingNextPage` + `fetchNextPage`                            |
| `useVisibleColumns` + `ColumnManagement`       | `useColumnState` + `ColumnManagementModal`                                        |

### Migration Steps

1. Replace `createTableHeaders` + `Row` component with a `ColumnDefinition[]` array
2. Replace `FilterContextProvider` with `useFilterState` / `useFilteredData` (wrap parent with `<NuqsAdapter>`)
3. Replace `<Table>` (legacy) with `<TableContainer>` + `<Table>` (TableV2)
4. Remove `useSortedResources` — set `enableSorting` and `sortable` on columns instead
5. Replace `infiniteLoaderProps` with the three infinite scroll props

## DO / DON'T

| DO                                                                                 | DON'T                                                                                     |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Use `accessorFn` for all columns                                                   | Use `accessorKey` (not supported)                                                         |
| Use stable `getRowId` (e.g. `metadata.uid`)                                        | Use array index as row ID                                                                 |
| Place `<Table>` inside a bounded-height scroll container                           | Let the table overflow the page without constraint                                        |
| Use `size` for proportional widths                                                 | Hardcode pixel widths on flex columns                                                     |
| Use `columnState` + `onColumnStateChange` when sharing state                       | Use `columnStateKey` when you need the modal to work                                      |
| Use `useCallback` for `scrollContainerRef`                                         | Use `useRef` for the virtualizer scroll container (stale ref)                             |
| Spread column def properties conditionally with `...(value ? { key: value } : {})` | Spread `undefined` into column defs (TanStack treats `undefined` differently from absent) |

## Known Gotchas

1. **`useRef` vs callback ref:** The virtualizer needs a callback ref (via `useState` + `useCallback`) for the scroll container, not `useRef`. A `useRef` can be stale during the initial render, causing the virtualizer to miss the container element.

2. **TanStack column def spreading:** When mapping `ColumnDefinition` to TanStack `ColumnDef`, do not spread `undefined` values. TanStack treats `{ cell: undefined }` differently from `{}` (absent key). Use conditional spreading: `...(col.cell ? { cell: col.cell } : {})`.

3. **PF Table `role`:** PatternFly's composable `Table` component renders `role="grid"`, not `role="table"`. This is intentional for accessibility with interactive cells.

4. **Bounded-height scroll container:** Virtualization requires the table's parent to have a bounded height (e.g., `height: 100%`, `minHeight: 0` in a flex context). Without it, the virtualizer cannot calculate visible rows and all rows will render.

## Known Gaps / Planned Features

The following capabilities are **not yet supported** by TableV2. If your view requires one of these, extend `TableV2` with the capability rather than building a bespoke table with inline PatternFly primitives.

| Capability                                                     | Status              | Tracking     |
| -------------------------------------------------------------- | ------------------- | ------------ |
| Row selection (single & multi-select with `Set<string>` state) | Not yet implemented | KFLUXUI-1346 |
