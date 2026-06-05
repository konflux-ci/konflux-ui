import { type ReactNode } from 'react';
import {
  type CellContext as TanStackCellContext,
  type SortingFn,
  type FilterFn,
} from '@tanstack/react-table';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type CellContext<TData> = TanStackCellContext<TData, unknown>;

export interface ColumnDefinition<TData> {
  id: string;
  header: string | ReactNode;
  accessorFn: (row: TData) => unknown;
  cell?: (info: CellContext<TData>) => ReactNode;
  size?: number;
  width?: string;
  sortable?: boolean;
  sortFn?: SortingFn<TData>;
  visibleFrom?: Breakpoint;
  nonHidable?: boolean;
  pinned?: 'start' | 'end';
  enableResizing?: boolean;
  filterFn?: FilterFn<TData>;
}

export interface ColumnState {
  visibleColumns: string[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface TableProps<TData> {
  data: TData[];
  columns: ColumnDefinition<TData>[];
  getRowId: (row: TData) => string;
  'aria-label': string;
  meta?: Record<string, unknown>;
  enableSorting?: boolean;
  enableExpansion?: boolean;
  expandedContent?: (row: TData) => ReactNode;
  enableGrouping?: boolean;
  groupBy?: string;
  groupByFn?: (row: TData) => string;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  columnStateKey?: string;
  scrollElement?: HTMLElement | null;
}

export interface TableContainerProps<TData> {
  data: TData[];
  unfilteredData: TData[];
  loaded: boolean;
  loadError?: Error;
  skeleton?: ReactNode;
  emptyState?: ReactNode;
  noDataState?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}
