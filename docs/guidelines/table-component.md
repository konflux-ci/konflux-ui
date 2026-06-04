# Table Component Guide

This document explains how to build list views using the shared table system in `src/shared/components/table/`.

## Architecture Overview

```
<ListView>
  +-- FilterContext (URL-synced filter state)
  +-- useDeepCompareMemoize (stable filter object)
  +-- useSortedResources / custom sort (memoized)
  +-- useVisibleColumns / useLocalStorage (column visibility)
  |
  +-- <ToolbarComponent>              -- renders filter inputs + "Manage Columns" button
  |
  +-- <Table                          -- src/shared/components/table/Table.tsx
  |     data={sortedFilteredData}
  |     unfilteredData={rawData}
  |     Header={HeaderFunc}           -- built via createTableHeaders() or direct function
  |     Row={ListRow}
  |     loaded={...}
  |     getRowProps={(obj) => ({ id: obj.metadata.name })}
  |     isInfiniteLoading / infiniteLoaderProps
  |   >
  |   +-- <StatusBox>                 -- loading spinner / error / NoDataEmptyMsg / EmptyMsg
  |       +-- <TableComponent>
  |           +-- <PfTable>           -- header row only (deprecated PF table)
  |           +-- <VirtualBody>       -- virtualized rows (react-virtualized)
  |               +-- <TableRow>      -- <Tr> with data-* attrs
  |                   +-- <Row>       -- your domain ListRow component
  |                       +-- <>
  |                           +-- <TableData className="...">...</TableData>
  |                           +-- <TableData className="pf-v5-c-table__action">
  |                                 <ActionMenu />
  |                               </TableData>
  |
  +-- <ColumnManagement />            -- modal for show/hide columns (optional)
```

## Step-by-Step: Creating a New Table

### Step 1: Define Column Classes and Header

Create `MyFeatureListHeader.ts`:

```ts
import { createTableHeaders } from '~/shared/components/table/utils';

// Column width classes -- PF responsive width utilities
export const myFeatureTableColumnClasses = {
  name: 'pf-m-width-30',
  status: 'pf-m-width-15',
  created: 'pf-m-width-20',
  description: 'pf-m-width-25',
  kebab: 'pf-v5-c-table__action',
};

// Sortable column indices
export enum SortableHeaders {
  name = 0,
  created = 2,
}

// Column configurations
const columns = [
  { title: 'Name', className: myFeatureTableColumnClasses.name, sortable: true },
  { title: 'Status', className: myFeatureTableColumnClasses.status },
  { title: 'Created', className: myFeatureTableColumnClasses.created, sortable: true },
  { title: 'Description', className: myFeatureTableColumnClasses.description },
  { title: ' ', className: myFeatureTableColumnClasses.kebab },
];

// createTableHeaders returns:
// (activeIndex, activeDirection, onSort) => () => ThProps[]
export default createTableHeaders(columns);
```

### Step 2: Create the Row Component

Create `MyFeatureListRow.tsx`:

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { TableData } from '~/shared';
import { RowFunctionArgs } from '~/shared/components/table';
import { ActionMenu, ActionMenuVariant } from '~/shared/components/action-menu';
import { Timestamp } from '~/shared/components/timestamp';
import { myFeatureTableColumnClasses } from './MyFeatureListHeader';
import { useMyFeatureActions } from './my-feature-actions';
import { MyFeatureKind } from '~/types/my-feature';

const MyFeatureListRow: React.FC<RowFunctionArgs<MyFeatureKind>> = ({ obj }) => {
  const actions = useMyFeatureActions(obj);

  return (
    <>
      <TableData className={myFeatureTableColumnClasses.name}>
        <Link to={`/details/${obj.metadata.name}`} data-test="my-feature-link">
          {obj.metadata.name}
        </Link>
      </TableData>
      <TableData className={myFeatureTableColumnClasses.status}>
        <StatusIcon status={obj.status?.phase} />
      </TableData>
      <TableData className={myFeatureTableColumnClasses.created}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={myFeatureTableColumnClasses.description}>
        {obj.spec?.description ?? '-'}
      </TableData>
      <TableData className={myFeatureTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default MyFeatureListRow;
```

Key conventions:
- The row renders a **React fragment** (`<>...</>`), not a `<tr>`. The `TableRow`/`VirtualBody` wraps it.
- Every cell uses `<TableData className={columnClasses.columnName}>`.
- The last cell is always the kebab menu with class `pf-v5-c-table__action`.
- Use `<Timestamp>` for dates, `<ActionMenu>` for actions, `<Link>` for navigation.

### Step 3: Create the List View

Create `MyFeatureListView.tsx`:

```tsx
import React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { Table } from '~/shared';
import { FilteredEmptyState } from '~/shared/components/empty-state';
import { useDeepCompareMemoize } from '~/shared/hooks';
import { useSortedResources } from '~/hooks/useSortedResources';
import { useMyFeatureData } from '~/hooks/useMyFeatureData';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { FilterContextProvider, useFilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import getMyFeatureHeader, { SortableHeaders } from './MyFeatureListHeader';
import MyFeatureListRow from './MyFeatureListRow';
import MyFeatureEmptyState from './MyFeatureEmptyState';

const sortPaths: Record<SortableHeaders, string> = {
  [SortableHeaders.name]: 'metadata.name',
  [SortableHeaders.created]: 'metadata.creationTimestamp',
};

const MyFeatureListContent: React.FC = () => {
  const namespace = useNamespace();
  const { data, isLoading, error } = useMyFeatureData(namespace);

  // Sort state
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(SortableHeaders.name);
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.asc,
  );

  // Filter state from URL
  const { unparsedFilters } = useFilterContext();
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });

  // Apply filters
  const filteredData = React.useMemo(
    () =>
      (data ?? []).filter((item) => {
        if (filters.name && !item.metadata.name.includes(filters.name)) return false;
        return true;
      }),
    [data, filters],
  );

  // Apply sorting
  const sortedData = useSortedResources(filteredData, activeSortIndex, activeSortDirection, sortPaths);

  // Build header with sort callbacks
  const Header = React.useMemo(
    () =>
      getMyFeatureHeader(activeSortIndex, activeSortDirection, (_event, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortDirection, activeSortIndex],
  );

  if (!isLoading && error) {
    return <ErrorEmptyState httpError={error} />;
  }

  return (
    <Table
      data={sortedData}
      unfilteredData={data}
      Header={Header}
      Row={MyFeatureListRow}
      loaded={!isLoading}
      EmptyMsg={FilteredEmptyState}
      NoDataEmptyMsg={MyFeatureEmptyState}
      aria-label="My Feature list"
      getRowProps={(obj) => ({ id: obj.metadata.name })}
      Toolbar={
        <BaseTextFilterToolbar
          label="name"
          dataTest="my-feature-filter"
        />
      }
    />
  );
};

// Wrap with FilterContextProvider to sync filters to URL
const MyFeatureListView: React.FC = () => (
  <FilterContextProvider filterParams={['name']}>
    <MyFeatureListContent />
  </FilterContextProvider>
);

export default MyFeatureListView;
```

## Key Table Props Reference

```ts
type TableProps<D, C> = {
  // Required
  data: D[];                          // Filtered/sorted data to render
  Header: HeaderFunc;                 // Column header definitions
  'aria-label': string;               // Accessibility label

  // Data states
  unfilteredData?: D[];               // Raw data for empty state logic
  loaded?: boolean;                   // False = show spinner
  loadError?: string | object;        // Show error state

  // Row rendering
  Row?: React.FC<RowFunctionArgs<D, C>>;
  ExpandedContent?: React.FC<RowFunctionArgs<D, C>>;
  customData?: C;                     // Passed to every Row as props.customData
  getRowProps?: (obj: D) => { id: ReactText; className?: string };

  // Empty states
  NoDataEmptyMsg?: React.ComponentType; // When unfilteredData is empty
  EmptyMsg?: React.ComponentType;       // When data is empty after filtering

  // Toolbar
  Toolbar?: ReactNode;                // Rendered above the table

  // Virtualization
  virtualize?: boolean;               // Default: true
  expand?: boolean;                   // Enable expand/collapse per row

  // Infinite scrolling
  isInfiniteLoading?: boolean;
  infiniteLoaderProps?: {
    rowCount?: number;
    loadMoreRows: (params) => Promise<unknown> | void;
    isRowLoaded: (params: { index: number }) => boolean;
  };
};
```

## Row Component Contract

```ts
type RowFunctionArgs<T = unknown, C = unknown> = {
  obj: T;           // The data item for this row
  columns: unknown[];
  customData?: C;   // Arbitrary shared data from the list view
  index?: number;
};
```

## Empty State Logic

`StatusBox` (wrapping the table) determines which empty state to show:

| Condition | What Shows |
|---|---|
| `loaded === false` | Spinner (via `skeleton` prop) |
| `loadError` is set | Error message (`LoadError` / `AccessDenied` for 403 / `NotFound` for 404) |
| `data` empty AND `unfilteredData` empty | `NoDataEmptyMsg` component |
| `data` empty BUT `unfilteredData` has items | `EmptyMsg` component (usually `FilteredEmptyState`) |

## Sorting Pattern

Sorting is client-side via `useSortedResources`:

```ts
import { useSortedResources } from '~/hooks/useSortedResources';

// Map column indices to lodash-compatible dot paths
const sortPaths: Record<SortableHeaders, string> = {
  [SortableHeaders.name]: 'metadata.name',
  [SortableHeaders.created]: 'metadata.creationTimestamp',
};

const sortedData = useSortedResources(data, activeSortIndex, activeSortDirection, sortPaths);
```

For custom sort logic (e.g., status by priority), apply a custom comparator after `useSortedResources`.

## Filtering Pattern

Filters live outside the table. Use `FilterContext` for URL-synced filter state:

1. Wrap list in `<FilterContextProvider filterParams={['name', 'status']}>`.
2. Read filters with `useFilterContext()`.
3. Stabilize filter objects with `useDeepCompareMemoize`.
4. Apply with `useMemo` on the raw data.
5. Pass filtered data as `data` and raw data as `unfilteredData`.

## Infinite Scroll Pattern

```tsx
<Table
  isInfiniteLoading
  infiniteLoaderProps={{
    isRowLoaded: (args) => !!filteredData[args.index],
    loadMoreRows: () => {
      if (hasNextPage && !isFetchingNextPage) {
        getNextPage?.();
      }
    },
    rowCount: hasNextPage ? filteredData.length + 1 : filteredData.length,
  }}
/>

{/* Loading indicator below table */}
{isFetchingNextPage && data.length > 0 && (
  <Bullseye>
    <Spinner size="lg" aria-label="Loading more items" />
  </Bullseye>
)}
```

## Column Management (Optional)

For tables with toggleable columns:

### 1. Define Column Keys and Config

```ts
type MyColumnKeys = 'name' | 'status' | 'branch' | 'created';

const COLUMN_DEFINITIONS: readonly ColumnDefinition<MyColumnKeys>[] = [
  { key: 'name', title: 'Name' },
  { key: 'status', title: 'Status' },
  { key: 'branch', title: 'Branch' },
  { key: 'created', title: 'Created' },
];

const COLUMN_ORDER: readonly MyColumnKeys[] = ['name', 'status', 'branch', 'created'];
const DEFAULT_VISIBLE: Set<MyColumnKeys> = new Set(COLUMN_ORDER);
const NON_HIDABLE: readonly MyColumnKeys[] = ['name'];
```

### 2. Use Visibility State

```tsx
import { useVisibleColumns } from '~/hooks/useVisibleColumns';

const [visibleColumns, setVisibleColumns] = useVisibleColumns(
  'my-feature-visible-columns',
  DEFAULT_VISIBLE,
);
```

### 3. Render Column Management Modal

```tsx
import { ColumnManagement } from '~/shared/components/table';

<ColumnManagement<MyColumnKeys>
  isOpen={isColumnManagementOpen}
  onClose={() => setIsColumnManagementOpen(false)}
  visibleColumns={visibleColumns}
  onVisibleColumnsChange={setVisibleColumns}
  columns={COLUMN_DEFINITIONS}
  defaultVisibleColumns={DEFAULT_VISIBLE}
  nonHidableColumns={NON_HIDABLE}
/>
```

### 4. Column-Aware Row Pattern

When columns are toggleable, use a data-driven render pattern:

```tsx
const MyFeatureListRow: React.FC<RowFunctionArgs<MyKind, { visibleColumns: Set<MyColumnKeys> }>> = ({
  obj,
  customData: { visibleColumns },
}) => {
  const columnComponents: Record<MyColumnKeys, React.ReactNode> = {
    name: <TableData key="name" className={classes.name}>{obj.metadata.name}</TableData>,
    status: <TableData key="status" className={classes.status}>{obj.status}</TableData>,
    branch: <TableData key="branch" className={classes.branch}>{obj.spec.branch}</TableData>,
    created: <TableData key="created" className={classes.created}><Timestamp ... /></TableData>,
  };

  return (
    <>
      {COLUMN_ORDER
        .filter((key) => visibleColumns.has(key))
        .map((key) => columnComponents[key])}
      <TableData className={classes.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};
```

## Dynamic Column Classes

For responsive column widths when columns are toggled, use `generateDynamicColumnClasses`:

```ts
import { generateDynamicColumnClasses, COMMON_COLUMN_CONFIGS } from '~/shared/components/table/dynamic-columns';

const getDynamicClasses = (visibleColumns: Set<MyColumnKeys>) =>
  generateDynamicColumnClasses(visibleColumns, COMMON_COLUMN_CONFIGS, {
    specialClasses: { name: 'wrap-column' },
  });
```

`COMMON_COLUMN_CONFIGS` provides pre-configured responsive widths for standard columns like `name`, `status`, `created`, `started`, `duration`, `kebab`.

## Common Width Classes

| Class | Width | Use For |
|---|---|---|
| `pf-m-width-10` | 10% | Status icons, narrow columns |
| `pf-m-width-15` | 15% | Timestamps, short text |
| `pf-m-width-20` | 20% | Names (compact), dates |
| `pf-m-width-25` | 25% | Medium text, descriptions |
| `pf-m-width-30` | 30% | Primary name column |
| `pf-m-width-35` | 35% | Wide name column |
| `pf-v5-c-table__action` | Auto | Always for the kebab/action column |
