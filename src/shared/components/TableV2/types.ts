import { type ReactNode } from 'react';
import {
  type CellContext as TanStackCellContext,
  type SortingFn,
  type FilterFn,
} from '@tanstack/react-table';

/**
 * PatternFly responsive breakpoint identifiers.
 *
 * Maps to minimum viewport widths: `sm` = 576px, `md` = 768px, `lg` = 992px,
 * `xl` = 1200px, `2xl` = 1450px. Used by {@link ColumnDefinition.visibleFrom}
 * to hide columns on smaller screens.
 */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Re-export of TanStack Table's `CellContext` with the value type fixed to
 * `unknown`. This simplifies column definitions so consumers only need to
 * provide a single `TData` generic instead of `TData, TValue`.
 *
 * @typeParam TData - The row data type
 */
export type CellContext<TData> = TanStackCellContext<TData, unknown>;

/**
 * Defines a column for the TableV2 component.
 *
 * @typeParam TData - The row data type
 *
 * @example
 * ```tsx
 * const columns: ColumnDefinition<PipelineRun>[] = [
 *   {
 *     id: 'name',
 *     header: 'Name',
 *     accessorFn: (row) => row.metadata.name,
 *     cell: (info) => <Link to={`/runs/${info.getValue()}`}>{info.getValue() as string}</Link>,
 *     size: 3,
 *     sortable: true,
 *   },
 *   {
 *     id: 'status',
 *     header: 'Status',
 *     accessorFn: (row) => row.status.phase,
 *     size: 1,
 *     visibleFrom: 'md',
 *   },
 * ];
 * ```
 */
export interface ColumnDefinition<TData> {
  /** Unique column identifier. Must be stable across renders. */
  id: string;

  /** Column header label. Can be a plain string or a ReactNode for custom rendering. */
  header: string | ReactNode;

  /**
   * Accessor function that extracts the cell value from a row.
   *
   * `accessorKey` is intentionally not supported — `accessorFn` is required
   * because row data in this codebase is often a Kubernetes resource with
   * deeply nested or computed fields. An explicit function avoids type
   * mismatches and keeps column definitions self-documenting.
   */
  accessorFn: (row: TData) => unknown;

  /**
   * Custom cell renderer. When omitted, the raw accessor value is rendered
   * as a string via TanStack's default cell.
   */
  cell?: (info: CellContext<TData>) => ReactNode;

  /**
   * Flex proportion for column width. Columns share available space in
   * proportion to their `size` values (default: 1). A column with `size: 3`
   * gets three times the space of a column with `size: 1`.
   *
   * Ignored when {@link width} is set.
   */
  size?: number;

  /**
   * Fixed CSS width string (e.g. `'120px'`, `'8rem'`). When set, this column
   * is removed from the flex-proportion calculation and rendered at the
   * exact specified width. Overrides {@link size}.
   */
  width?: string;

  /** Whether the column supports sorting. Defaults to `false`. */
  sortable?: boolean;

  /**
   * Custom sorting function. When omitted, TanStack Table's default
   * alphanumeric sort is used. Only relevant when {@link sortable} is `true`.
   */
  sortFn?: SortingFn<TData>;

  /**
   * Responsive breakpoint at which this column becomes visible. Below this
   * breakpoint the column is automatically hidden. See {@link Breakpoint}
   * for pixel values.
   */
  visibleFrom?: Breakpoint;

  /**
   * When `true`, prevents users from hiding this column via column-visibility
   * controls (e.g. the column management dropdown).
   */
  nonHidable?: boolean;

  /** Pins the column to the start or end of the table. */
  pinned?: 'start' | 'end';

  /** Whether the column can be resized by dragging. Reserved for future use. */
  enableResizing?: boolean;

  /** Custom filter function for this column. Reserved for future use. */
  filterFn?: FilterFn<TData>;
}

/**
 * Serializable column state used for persistence and state management.
 *
 * Stored in `localStorage` when a {@link TableProps.columnStateKey} is
 * provided, or held in React state otherwise. Managed by `useColumnState`.
 */
export interface ColumnState {
  /** Ordered list of visible column IDs. Order determines column display order. */
  visibleColumns: string[];

  /** ID of the currently sorted column, if any. */
  sortColumn?: string;

  /** Sort direction for {@link sortColumn}. */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Props for the {@link Table} component — the main TableV2 orchestrator.
 *
 * @typeParam TData - The row data type
 *
 * @example
 * ```tsx
 * <Table
 *   data={pipelineRuns}
 *   columns={columns}
 *   getRowId={(row) => row.metadata.uid}
 *   aria-label="Pipeline runs"
 *   enableSorting
 *   columnStateKey="pipeline-runs-table"
 *   hasNextPage={hasNextPage}
 *   isFetchingNextPage={isFetchingNextPage}
 *   fetchNextPage={fetchNextPage}
 * />
 * ```
 */
export interface TableProps<TData> {
  /** Array of row data to display. */
  data: TData[];

  /** Column definitions describing each column's rendering and behavior. */
  columns: ColumnDefinition<TData>[];

  /** Returns a unique, stable string ID for a given row. Used for React keys and row identity. */
  getRowId: (row: TData) => string;

  /** Accessible label for the table element. Required for screen readers. */
  'aria-label': string;

  /**
   * Arbitrary metadata passed through to TanStack Table's `meta` option.
   * Accessible inside column definitions via `table.options.meta`.
   */
  meta?: Record<string, unknown>;

  /** Enables client-side column sorting. Defaults to `false`. */
  enableSorting?: boolean;

  /** Enables expandable rows. When `true`, each row gets an expand/collapse toggle. */
  enableExpansion?: boolean;

  /** Render function for expanded row content. Only called when the row is expanded. */
  expandedContent?: (row: TData) => ReactNode;

  /** Enables row grouping by a column or custom function. Reserved for future use. */
  enableGrouping?: boolean;

  /** Column ID to group rows by. Used with {@link enableGrouping}. Reserved for future use. */
  groupBy?: string;

  /** Custom function to derive the group key for a row. Reserved for future use. */
  groupByFn?: (row: TData) => string;

  /** Enables row selection checkboxes. Reserved for future use. */
  enableRowSelection?: boolean;

  /** Callback fired when row selection changes. Reserved for future use. */
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;

  /**
   * Whether more data is available for infinite scroll. When `true` and the
   * user scrolls near the bottom, {@link fetchNextPage} is called.
   */
  hasNextPage?: boolean;

  /** Whether the next page of data is currently being fetched. */
  isFetchingNextPage?: boolean;

  /** Callback to fetch the next page of data for infinite scroll. */
  fetchNextPage?: () => void;

  /**
   * LocalStorage key for persisting column state (visibility, order, sort).
   * When omitted, column state is held in ephemeral React state and resets
   * on unmount.
   */
  columnStateKey?: string;

  /**
   * External scroll container element. When provided, virtualization and
   * infinite scroll listen to this element instead of the built-in scroll div.
   * Useful when the table is inside a page-level scroll container.
   */
  scrollElement?: HTMLElement | null;
}

/**
 * Props for the {@link TableContainer} state machine wrapper.
 *
 * `TableContainer` renders different states based on loading/data conditions:
 * - `!loaded` → skeleton (or custom `skeleton` prop)
 * - `loadError` → error message
 * - `unfilteredData` empty → `noDataState` (no resources exist at all)
 * - `data` empty → `emptyState` (resources exist but filters match nothing)
 * - otherwise → `children` (the table)
 *
 * @typeParam TData - The row data type
 *
 * @example
 * ```tsx
 * <TableContainer
 *   data={filteredRuns}
 *   unfilteredData={allRuns}
 *   loaded={loaded}
 *   loadError={error}
 *   emptyState={<EmptyFilterState onClear={clearFilters} />}
 *   noDataState={<EmptyState>No pipeline runs yet</EmptyState>}
 *   toolbar={<Toolbar filters={filters} />}
 * >
 *   <Table data={filteredRuns} columns={columns} ... />
 * </TableContainer>
 * ```
 */
export interface TableContainerProps<TData> {
  /** Filtered data (after search/filter). Used to decide between emptyState and children. */
  data: TData[];

  /** Unfiltered data (all rows before filtering). Used to distinguish "no data" from "no matches". */
  unfilteredData: TData[];

  /** Whether the initial data load has completed. */
  loaded: boolean;

  /** Error from the initial data load, if any. */
  loadError?: Error;

  /** Custom skeleton to show while loading. Defaults to a generic `TableSkeleton`. */
  skeleton?: ReactNode;

  /** Content to display when filters match no rows but unfiltered data exists. */
  emptyState?: ReactNode;

  /** Content to display when no data exists at all (before any filtering). */
  noDataState?: ReactNode;

  /** Toolbar rendered above the table content in all states. */
  toolbar?: ReactNode;

  /** The table content rendered when data is loaded and non-empty. */
  children: ReactNode;
}
