import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
  type Table,
  type Row,
} from '@tanstack/react-table';
import { type ColumnDefinition, type ColumnState } from '../types';

export interface UseTableOptions<TData> {
  data: TData[];
  columns: ColumnDefinition<TData>[];
  getRowId: (row: TData) => string;
  columnState: ColumnState;
  setColumnState: (state: ColumnState) => void;
  responsiveColumnVisibility: Record<string, boolean>;
  enableSorting?: boolean;
  enableExpansion?: boolean;
  enableGrouping?: boolean;
  meta?: Record<string, unknown>;
}

export interface UseTableResult<TData> {
  table: Table<TData>;
  rows: Row<TData>[];
}

function mapColumns<TData>(columns: ColumnDefinition<TData>[]): ColumnDef<TData>[] {
  return columns.map((col) => ({
    id: col.id,
    header: col.header as string,
    accessorFn: col.accessorFn,
    cell: col.cell,
    size: col.size,
    enableSorting: col.sortable,
    sortingFn: col.sortFn,
    enableResizing: col.enableResizing,
    filterFn: col.filterFn,
  }));
}

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

  const expanded: ExpandedState | undefined = enableExpansion ? {} : undefined;

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
      ...(expanded !== undefined ? { expanded } : {}),
    },
    meta,
  });

  const rows = table.getRowModel().rows;

  return { table, rows };
}
