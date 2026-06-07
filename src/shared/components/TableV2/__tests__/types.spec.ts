/**
 * Type-level tests for TableV2 types.
 *
 * These tests verify that our type definitions compile correctly and enforce
 * the API contracts documented in the research doc. Runtime assertions are
 * minimal — the goal is to catch type errors at compile time via `yarn type-checks`.
 */
import { type ReactNode } from 'react';
import { type CellContext as TanStackCellContext } from '@tanstack/react-table';
import {
  type ColumnDefinition,
  type ColumnState,
  type TableProps,
  type TableContainerProps,
  type CellContext,
  type Breakpoint,
} from '~/shared/components/TableV2';

// --- Test data types ---

interface PipelineRun {
  metadata: {
    uid: string;
    name: string;
    labels?: Record<string, string>;
  };
  status?: {
    startTime?: string;
    completionTime?: string;
  };
}

// --- ColumnDefinition tests ---

describe('ColumnDefinition', () => {
  it('requires id and header, accessorFn is optional', () => {
    const col: ColumnDefinition<PipelineRun> = {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => row.metadata.name,
    };
    expect(col.id).toBe('name');
    expect(col.header).toBe('Name');
    expect(typeof col.accessorFn).toBe('function');

    // Display-only column (e.g. actions) — no accessorFn needed
    const displayCol: ColumnDefinition<PipelineRun> = {
      id: 'actions',
      header: '',
    };
    expect(displayCol.accessorFn).toBeUndefined();
  });

  it('accepts all optional fields', () => {
    const col: ColumnDefinition<PipelineRun> = {
      id: 'status',
      header: 'Status',
      accessorFn: (row) => row.status?.startTime,
      cell: (info: CellContext<PipelineRun>) => {
        void info;
        return 'rendered' as unknown as ReactNode;
      },
      size: 2,
      sortable: true,
      visibleFrom: 'md',
      nonHidable: false,
      pinned: 'start',
      enableResizing: false,
    };
    expect(col.size).toBe(2);
    expect(col.visibleFrom).toBe('md');
    expect(col.pinned).toBe('start');
  });

  it('accepts width for fixed-width columns (mutually exclusive with size in practice)', () => {
    const col: ColumnDefinition<PipelineRun> = {
      id: 'actions',
      header: '',
      accessorFn: () => null,
      width: '48px',
      pinned: 'end',
      nonHidable: true,
    };
    expect(col.width).toBe('48px');
  });

  it('accepts pinned as start or end', () => {
    const startCol: ColumnDefinition<PipelineRun> = {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => row.metadata.name,
      pinned: 'start',
    };
    const endCol: ColumnDefinition<PipelineRun> = {
      id: 'actions',
      header: '',
      accessorFn: () => null,
      pinned: 'end',
    };
    expect(startCol.pinned).toBe('start');
    expect(endCol.pinned).toBe('end');
  });

  it('accepts all breakpoint values for visibleFrom', () => {
    const breakpoints: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
    breakpoints.forEach((bp) => {
      const col: ColumnDefinition<PipelineRun> = {
        id: `col-${bp}`,
        header: bp,
        accessorFn: () => null,
        visibleFrom: bp,
      };
      expect(col.visibleFrom).toBe(bp);
    });
  });

  it('accessorFn receives the correct row type', () => {
    const col: ColumnDefinition<PipelineRun> = {
      id: 'labels',
      header: 'Labels',
      accessorFn: (row) => row.metadata.labels?.component ?? '',
    };
    const result = col.accessorFn({
      metadata: { uid: '1', name: 'test', labels: { component: 'frontend' } },
    });
    expect(result).toBe('frontend');
  });

  it('cell renderer receives CellContext with correct TData', () => {
    // Verify CellContext is compatible with @tanstack/react-table's CellContext
    const col: ColumnDefinition<PipelineRun> = {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => row.metadata.name,
      cell: (info) => {
        // info should have getValue, row, table, etc.
        void info.getValue();
        void info.row;
        void info.table;
        return null;
      },
    };
    expect(col.cell).toBeDefined();
  });
});

// --- ColumnState tests ---

describe('ColumnState', () => {
  it('has required visibleColumns and columnOrder arrays', () => {
    const state: ColumnState = {
      visibleColumns: ['name', 'status', 'actions'],
      columnOrder: ['name', 'status', 'actions'],
    };
    expect(state.visibleColumns).toHaveLength(3);
    expect(state.columnOrder).toHaveLength(3);
  });

  it('accepts optional sort state', () => {
    const state: ColumnState = {
      visibleColumns: ['name', 'status'],
      columnOrder: ['name', 'status'],
      sortColumn: 'name',
      sortDirection: 'asc',
    };
    expect(state.sortColumn).toBe('name');
    expect(state.sortDirection).toBe('asc');
  });

  it('accepts desc sort direction', () => {
    const state: ColumnState = {
      visibleColumns: ['name'],
      columnOrder: ['name'],
      sortDirection: 'desc',
    };
    expect(state.sortDirection).toBe('desc');
  });
});

// --- TableProps tests ---

describe('TableProps', () => {
  it('requires data, columns, and getRowId', () => {
    const data: PipelineRun[] = [];
    const columns: ColumnDefinition<PipelineRun>[] = [];

    const props: TableProps<PipelineRun> = {
      data,
      columns,
      getRowId: (row) => row.metadata.uid,
      'aria-label': 'Test table',
    };
    expect(props.data).toBe(data);
    expect(props.columns).toBe(columns);
  });

  it('accepts meta as Record<string, unknown>', () => {
    const props: TableProps<PipelineRun> = {
      data: [],
      columns: [],
      getRowId: (row) => row.metadata.uid,
      'aria-label': 'Test table',
      meta: { applicationName: 'my-app', canDelete: true },
    };
    expect(props.meta?.applicationName).toBe('my-app');
  });

  it('accepts all optional feature flags', () => {
    const props: TableProps<PipelineRun> = {
      data: [],
      columns: [],
      getRowId: (row) => row.metadata.uid,
      'aria-label': 'Test table',
      enableSorting: true,
      enableExpansion: true,
      expandedContent: (row) => {
        void row;
        return null;
      },
      enableGrouping: true,
      groupBy: 'component',
      columnStateKey: 'pipeline-runs',
    };
    expect(props.enableSorting).toBe(true);
    expect(props.enableExpansion).toBe(true);
    expect(props.columnStateKey).toBe('pipeline-runs');
  });

  it('accepts infinite scroll props', () => {
    const props: TableProps<PipelineRun> = {
      data: [],
      columns: [],
      getRowId: (row) => row.metadata.uid,
      'aria-label': 'Test table',
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: () => undefined,
    };
    expect(props.hasNextPage).toBe(true);
  });

  it('accepts scrollElement for custom scroll container', () => {
    const props: TableProps<PipelineRun> = {
      data: [],
      columns: [],
      getRowId: (row) => row.metadata.uid,
      'aria-label': 'Test table',
      scrollElement: null,
    };
    expect(props.scrollElement).toBeNull();
  });
});

// --- TableContainerProps tests ---

describe('TableContainerProps', () => {
  it('requires data, unfilteredData, and loaded', () => {
    const props: TableContainerProps<PipelineRun> = {
      data: [],
      unfilteredData: [],
      loaded: true,
      children: null,
    };
    expect(props.loaded).toBe(true);
  });

  it('accepts error, skeleton, empty states, and toolbar', () => {
    const props: TableContainerProps<PipelineRun> = {
      data: [],
      unfilteredData: [],
      loaded: false,
      loadError: new Error('network error'),
      skeleton: null as unknown as ReactNode,
      emptyState: null as unknown as ReactNode,
      noDataState: null as unknown as ReactNode,
      toolbar: null as unknown as ReactNode,
      children: null,
    };
    expect(props.loadError).toBeInstanceOf(Error);
  });
});

// --- CellContext type compatibility ---

describe('CellContext', () => {
  it('is compatible with @tanstack/react-table CellContext', () => {
    // Verify that our re-exported CellContext is the same as TanStack's
    // This is a compile-time check — if types are incompatible, this won't compile
    // Verify that our re-exported CellContext is assignable to TanStack's.
    // Compile-time check: if CellContext<PipelineRun> is not assignable, this cast fails.
    const check: CellContext<PipelineRun> = {} as TanStackCellContext<PipelineRun, unknown>;
    void check;
    expect(true).toBe(true);
  });
});
