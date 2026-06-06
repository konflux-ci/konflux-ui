import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type SortingState,
  type Table,
  type Row,
} from '@tanstack/react-table';
import { type ColumnDefinition, type ColumnState } from '../types';

/**
 * Options for the {@link useTable} hook.
 *
 * @typeParam TData - The row data type
 */
export interface UseTableOptions<TData> {
  /** Array of row data to display. */
  data: TData[];
  /** Column definitions for the table. */
  columns: ColumnDefinition<TData>[];
  /** Returns a unique, stable string ID for a given row. */
  getRowId: (row: TData) => string;
  /** Current column state (visibility, order, sort). */
  columnState: ColumnState;
  /** Updater for column state. */
  setColumnState: (state: ColumnState) => void;
  /** Responsive column visibility map from `useResponsiveColumns`. */
  responsiveColumnVisibility: Record<string, boolean>;
  /** Enables client-side sorting. */
  enableSorting?: boolean;
  /** Enables expandable rows. */
  enableExpansion?: boolean;
  /** Enables row grouping. Reserved for future use. */
  enableGrouping?: boolean;
  /** Arbitrary metadata passed to TanStack Table's `meta` option. */
  meta?: Record<string, unknown>;
}

/**
 * Return value of the {@link useTable} hook.
 *
 * @typeParam TData - The row data type
 */
export interface UseTableResult<TData> {
  /** The TanStack Table instance. */
  table: Table<TData>;
  /** The current row model (post-sort, post-filter). */
  rows: Row<TData>[];
}

/** Maps `ColumnDefinition` to TanStack `ColumnDef`, translating our API to theirs. */
function mapColumns<TData>(columns: ColumnDefinition<TData>[]): ColumnDef<TData>[] {
  return columns.map((col) => ({
    id: col.id,
    header: col.header as string,
    accessorFn: col.accessorFn,
    ...(col.cell ? { cell: col.cell } : {}),
    size: col.size,
    enableSorting: col.sortable ?? false,
    ...(col.sortFn ? { sortingFn: col.sortFn } : {}),
    enableResizing: col.enableResizing,
    ...(col.filterFn ? { filterFn: col.filterFn } : {}),
  }));
}

/**
 * Merges user column visibility (from column state) with responsive visibility
 * (from breakpoint matching). A column is visible only if both the user and
 * the responsive check agree it should be shown.
 */
function mergeColumnVisibility(
  columns: ColumnDefinition<unknown>[],
  columnState: ColumnState,
  responsiveVisibility: Record<string, boolean>,
): Record<string, boolean> {
  const userVisible = new Set(columnState.visibleColumns);
  const visibility: Record<string, boolean> = {};

  for (const col of columns) {
    const inUserSet = userVisible.has(col.id);
    const responsiveVal = responsiveVisibility[col.id];
    // If responsive says hidden, column is hidden regardless of user state
    // If responsive has no opinion (undefined), defer to user visibility
    const isResponsiveVisible = responsiveVal === undefined ? true : responsiveVal;
    visibility[col.id] = inUserSet && isResponsiveVisible;
  }

  return visibility;
}

/**
 * Core hook that wraps TanStack's `useReactTable` with TableV2 conventions.
 *
 * Handles:
 * - Mapping `ColumnDefinition` to TanStack `ColumnDef`
 * - Merging user and responsive column visibility
 * - Applying column order from `ColumnState`
 * - Deriving `SortingState` from `ColumnState`
 * - Conditionally enabling sorted/expanded row models
 *
 * @typeParam TData - The row data type
 * @param options - Configuration for the table instance
 * @returns The TanStack table instance and the current row model
 *
 * @example
 * ```tsx
 * const { table, rows } = useTable({
 *   data,
 *   columns,
 *   getRowId: (row) => row.id,
 *   columnState,
 *   setColumnState,
 *   responsiveColumnVisibility: columnVisibility,
 *   enableSorting: true,
 * });
 * ```
 */
export function useTable<TData>(options: UseTableOptions<TData>): UseTableResult<TData> {
  const {
    data,
    columns,
    getRowId,
    columnState,
    responsiveColumnVisibility,
    enableSorting,
    enableExpansion,
    meta,
  } = options;

  const columnDefs = useMemo(() => mapColumns(columns), [columns]);

  const columnVisibility = useMemo(
    () =>
      mergeColumnVisibility(
        columns as ColumnDefinition<unknown>[],
        columnState,
        responsiveColumnVisibility,
      ),
    [columns, columnState, responsiveColumnVisibility],
  );

  const columnOrder = columnState.visibleColumns;

  const sorting: SortingState | undefined = useMemo(() => {
    if (!enableSorting || !columnState.sortColumn) return undefined;
    return [{ id: columnState.sortColumn, desc: columnState.sortDirection === 'desc' }];
  }, [enableSorting, columnState.sortColumn, columnState.sortDirection]);

  const table = useReactTable<TData>({
    data,
    columns: columnDefs,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(enableExpansion
      ? {
          getExpandedRowModel: getExpandedRowModel(),
          getRowCanExpand: () => true,
        }
      : {}),
    state: {
      columnVisibility,
      columnOrder,
      ...(sorting ? { sorting } : {}),
    },
    meta,
  });

  const rows = table.getRowModel().rows;

  return { table, rows };
}
