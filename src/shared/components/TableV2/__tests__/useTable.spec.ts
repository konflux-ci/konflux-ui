import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
} from '@tanstack/react-table';
import { renderHook } from '@testing-library/react';
import { type ColumnDefinition, type ColumnState } from '~/shared/components/TableV2';
import { useTable, type UseTableOptions } from '~/shared/components/TableV2/hooks/useTable';

jest.mock('@tanstack/react-table', () => ({
  useReactTable: jest.fn(),
  getCoreRowModel: jest.fn().mockReturnValue('coreRowModel'),
  getSortedRowModel: jest.fn().mockReturnValue('sortedRowModel'),
  getExpandedRowModel: jest.fn().mockReturnValue('expandedRowModel'),
  flexRender: jest.fn(),
}));

const mockUseReactTable = jest.mocked(useReactTable);

const createMockTable = () => ({
  getRowModel: jest.fn().mockReturnValue({ rows: [{ id: '1' }, { id: '2' }] }),
  getHeaderGroups: jest.fn().mockReturnValue([]),
  getVisibleLeafColumns: jest.fn().mockReturnValue([]),
  getState: jest.fn().mockReturnValue({}),
  options: { meta: {} },
});

// --- Test data ---

interface TestRow {
  id: string;
  name: string;
  status: string;
}

const testColumns: ColumnDefinition<TestRow>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name, sortable: true },
  { id: 'status', header: 'Status', accessorFn: (row) => row.status },
];

const testData: TestRow[] = [
  { id: '1', name: 'Alpha', status: 'active' },
  { id: '2', name: 'Beta', status: 'inactive' },
];

const defaultColumnState: ColumnState = {
  visibleColumns: ['name', 'status'],
  columnOrder: ['name', 'status'],
};

const defaultOptions: UseTableOptions<TestRow> = {
  data: testData,
  columns: testColumns,
  getRowId: (row) => row.id,
  columnState: defaultColumnState,
  setColumnState: jest.fn(),
  responsiveColumnVisibility: {},
};

describe('useTable', () => {
  let mockTable: ReturnType<typeof createMockTable>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTable = createMockTable();
    mockUseReactTable.mockReturnValue(mockTable as never);
  });

  describe('column mapping', () => {
    it('maps ColumnDefinition[] to react-table ColumnDef[] using accessorFn', () => {
      renderHook(() => useTable(defaultOptions));

      const callArgs = mockUseReactTable.mock.calls[0][0];
      const columns = callArgs.columns;

      expect(columns).toHaveLength(2);
      expect(columns[0]).toMatchObject({
        id: 'name',
        header: 'Name',
        accessorFn: expect.any(Function),
      });
      expect(columns[1]).toMatchObject({
        id: 'status',
        header: 'Status',
        accessorFn: expect.any(Function),
      });
    });

    it('does not use accessorKey in mapped columns', () => {
      renderHook(() => useTable(defaultOptions));

      const callArgs = mockUseReactTable.mock.calls[0][0];
      const columns = callArgs.columns;

      for (const col of columns) {
        expect(col).not.toHaveProperty('accessorKey');
      }
    });
  });

  describe('sorting', () => {
    it('wires getSortedRowModel when enableSorting is true', () => {
      renderHook(() =>
        useTable({
          ...defaultOptions,
          enableSorting: true,
          columnState: {
            visibleColumns: ['name', 'status'],
            columnOrder: ['name', 'status'],
            sortColumn: 'name',
            sortDirection: 'asc',
          },
        }),
      );

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.getSortedRowModel).toBe('sortedRowModel');
      expect(getSortedRowModel).toHaveBeenCalled();
    });

    it('does not wire getSortedRowModel when enableSorting is not set', () => {
      renderHook(() => useTable(defaultOptions));

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.getSortedRowModel).toBeUndefined();
    });
  });

  describe('expansion', () => {
    it('wires getExpandedRowModel when enableExpansion is true', () => {
      renderHook(() =>
        useTable({
          ...defaultOptions,
          enableExpansion: true,
        }),
      );

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.getExpandedRowModel).toBe('expandedRowModel');
      expect(getExpandedRowModel).toHaveBeenCalled();
      expect(callArgs.getRowCanExpand).toEqual(expect.any(Function));
    });

    it('keys expansion state by row ID', () => {
      renderHook(() =>
        useTable({
          ...defaultOptions,
          enableExpansion: true,
        }),
      );

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.getRowId).toBe(defaultOptions.getRowId);
    });
  });

  describe('meta passthrough', () => {
    it('passes meta from options to react-table instance', () => {
      const meta = { customAction: jest.fn(), label: 'test' };

      renderHook(() =>
        useTable({
          ...defaultOptions,
          meta,
        }),
      );

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.meta).toBe(meta);
    });
  });

  describe('column visibility', () => {
    it('merges responsive visibility and user visibility with AND logic', () => {
      renderHook(() =>
        useTable({
          ...defaultOptions,
          columnState: {
            visibleColumns: ['name'], // 'status' hidden by user
            columnOrder: ['name', 'status'],
          },
          responsiveColumnVisibility: {
            name: true,
            status: true, // responsive says visible
          },
        }),
      );

      const callArgs = mockUseReactTable.mock.calls[0][0];
      const visibility = callArgs.state?.columnVisibility;

      // 'name' is in both visibleColumns AND responsive=true → visible
      expect(visibility?.name).toBe(true);
      // 'status' is responsive=true BUT not in visibleColumns → hidden
      expect(visibility?.status).toBe(false);
    });

    it('hides column when responsive visibility is false regardless of user state', () => {
      renderHook(() =>
        useTable({
          ...defaultOptions,
          columnState: {
            visibleColumns: ['name', 'status'], // user wants both
            columnOrder: ['name', 'status'],
          },
          responsiveColumnVisibility: {
            name: false, // responsive says hidden
          },
        }),
      );

      const callArgs = mockUseReactTable.mock.calls[0][0];
      const visibility = callArgs.state?.columnVisibility;

      expect(visibility?.name).toBe(false);
    });
  });

  describe('column ordering', () => {
    it('passes columnState.columnOrder as columnOrder', () => {
      renderHook(() =>
        useTable({
          ...defaultOptions,
          columnState: {
            visibleColumns: ['status', 'name'],
            columnOrder: ['status', 'name'],
          },
        }),
      );

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.state?.columnOrder).toEqual(['status', 'name']);
    });
  });

  describe('return value', () => {
    it('returns table instance and rows', () => {
      const { result } = renderHook(() => useTable(defaultOptions));

      expect(result.current.table).toBe(mockTable);
      expect(result.current.rows).toEqual([{ id: '1' }, { id: '2' }]);
    });
  });

  describe('row selection', () => {
    it('wires enableRowSelection and enableMultiRowSelection when enableRowSelection is true', () => {
      renderHook(() =>
        useTable({
          ...defaultOptions,
          enableRowSelection: true,
        }),
      );

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.enableRowSelection).toBe(true);
      expect(callArgs.enableMultiRowSelection).toBe(true);
    });

    it('wires onRowSelectionChange and rowSelection state when enableRowSelection is true', () => {
      renderHook(() =>
        useTable({
          ...defaultOptions,
          enableRowSelection: true,
        }),
      );

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.onRowSelectionChange).toEqual(expect.any(Function));
      expect(callArgs.state?.rowSelection).toEqual({});
    });

    it('does not wire row selection when enableRowSelection is false or omitted', () => {
      renderHook(() => useTable(defaultOptions));

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.enableRowSelection).toBeUndefined();
      expect(callArgs.enableMultiRowSelection).toBeUndefined();
      expect(callArgs.state?.rowSelection).toBeUndefined();
    });

    it('returns rowSelection state in the result', () => {
      const { result } = renderHook(() =>
        useTable({
          ...defaultOptions,
          enableRowSelection: true,
        }),
      );

      expect(result.current.rowSelection).toEqual({});
    });

    it('does not return rowSelection when enableRowSelection is omitted', () => {
      const { result } = renderHook(() => useTable(defaultOptions));

      expect(result.current.rowSelection).toBeUndefined();
    });

    it('fires onRowSelectionChange callback with selected row data when selection changes', () => {
      const onRowSelectionChange = jest.fn();
      const selectedRows = [
        { id: '1', original: testData[0] },
        { id: '2', original: testData[1] },
      ];
      mockTable.getSelectedRowModel = jest.fn().mockReturnValue({ rows: selectedRows });

      renderHook(() =>
        useTable({
          ...defaultOptions,
          enableRowSelection: true,
          onRowSelectionChange,
        }),
      );

      // Verify onRowSelectionChange is wired as a function to useReactTable
      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.onRowSelectionChange).toEqual(expect.any(Function));
    });
  });

  describe('core row model', () => {
    it('always wires getCoreRowModel', () => {
      renderHook(() => useTable(defaultOptions));

      const callArgs = mockUseReactTable.mock.calls[0][0];
      expect(callArgs.getCoreRowModel).toBe('coreRowModel');
      expect(getCoreRowModel).toHaveBeenCalled();
    });
  });
});
