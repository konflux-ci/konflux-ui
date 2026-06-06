import { render, screen } from '@testing-library/react';
import { computeColumnWidths } from '~/shared/components/TableV2/column-widths';
import { useColumnState } from '~/shared/components/TableV2/hooks/useColumnState';
import { useInfiniteScroll } from '~/shared/components/TableV2/hooks/useInfiniteScroll';
import { useResponsiveColumns } from '~/shared/components/TableV2/hooks/useResponsiveColumns';
import { useTable } from '~/shared/components/TableV2/hooks/useTable';
import { useVirtualization } from '~/shared/components/TableV2/hooks/useVirtualization';
import { Table } from '~/shared/components/TableV2/Table';
import { type ColumnDefinition } from '~/shared/components/TableV2/types';

jest.mock('~/shared/components/TableV2/hooks/useTable');
jest.mock('~/shared/components/TableV2/hooks/useColumnState');
jest.mock('~/shared/components/TableV2/hooks/useResponsiveColumns');
jest.mock('~/shared/components/TableV2/hooks/useVirtualization');
jest.mock('~/shared/components/TableV2/hooks/useInfiniteScroll');
jest.mock('~/shared/components/TableV2/TableHeader', () => ({
  TableHeader: () => <thead data-test="table-header" />,
}));
jest.mock('~/shared/components/TableV2/TableBody', () => ({
  TableBody: () => <tbody data-test="table-body" />,
}));
jest.mock('~/shared/components/TableV2/column-widths', () => ({
  computeColumnWidths: jest.fn().mockReturnValue([]),
}));

type TestData = { id: string; name: string };

const columns: ColumnDefinition<TestData>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name },
  { id: 'id', header: 'ID', accessorFn: (row) => row.id },
];

const defaultProps = {
  data: [{ id: '1', name: 'App 1' }] as TestData[],
  columns,
  getRowId: (row: TestData) => row.id,
  'aria-label': 'Test table',
};

beforeEach(() => {
  jest.mocked(useTable).mockReturnValue({
    table: { getVisibleLeafColumns: () => [1, 2, 3] } as never,
    rows: [],
  });
  jest.mocked(useColumnState).mockReturnValue({
    columnState: { visibleColumns: ['name', 'id'] },
    setColumnState: jest.fn(),
  });
  jest.mocked(useResponsiveColumns).mockReturnValue({
    columnVisibility: {},
  });
  jest.mocked(useVirtualization).mockReturnValue({
    virtualizer: { getTotalSize: () => 500 } as never,
    virtualRows: [],
  });
});

describe('Table', () => {
  it('renders TableHeader and TableBody', () => {
    render(<Table {...defaultProps} />);

    expect(screen.getByTestId('table-header')).toBeInTheDocument();
    expect(screen.getByTestId('table-body')).toBeInTheDocument();
  });

  it('has data-test="table-v2" on the outer element', () => {
    render(<Table {...defaultProps} />);

    expect(screen.getByTestId('table-v2')).toBeInTheDocument();
  });

  it('renders a PF Table with the provided aria-label', () => {
    render(<Table {...defaultProps} />);

    expect(screen.getByRole('grid', { name: 'Test table' })).toBeInTheDocument();
  });

  it('calls useColumnState with columnStateKey and columns', () => {
    render(<Table {...defaultProps} columnStateKey="my-table" />);

    expect(useColumnState).toHaveBeenCalledWith('my-table', columns);
  });

  it('calls useResponsiveColumns with columns', () => {
    render(<Table {...defaultProps} />);

    expect(useResponsiveColumns).toHaveBeenCalledWith(columns);
  });

  it('calls useTable with correct options', () => {
    const setColumnState = jest.fn();
    jest.mocked(useColumnState).mockReturnValue({
      columnState: { visibleColumns: ['name', 'id'] },
      setColumnState,
    });
    jest.mocked(useResponsiveColumns).mockReturnValue({
      columnVisibility: { name: true },
    });

    render(<Table {...defaultProps} enableSorting enableExpansion meta={{ key: 'val' }} />);

    expect(useTable).toHaveBeenCalledWith(
      expect.objectContaining({
        data: defaultProps.data,
        columns,
        getRowId: defaultProps.getRowId,
        columnState: { visibleColumns: ['name', 'id'] },
        setColumnState,
        responsiveColumnVisibility: { name: true },
        enableSorting: true,
        enableExpansion: true,
        meta: { key: 'val' },
      }),
    );
  });

  it('calls useVirtualization with the row count', () => {
    jest.mocked(useTable).mockReturnValue({
      table: { getVisibleLeafColumns: () => [1, 2] } as never,
      rows: [{}, {}, {}] as never[],
    });

    render(<Table {...defaultProps} />);

    expect(useVirtualization).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 3,
      }),
    );
  });

  it('calls useInfiniteScroll when hasNextPage is provided', () => {
    const fetchNextPage = jest.fn();
    render(
      <Table
        {...defaultProps}
        hasNextPage
        isFetchingNextPage={false}
        fetchNextPage={fetchNextPage}
      />,
    );

    expect(useInfiniteScroll).toHaveBeenCalledWith(
      expect.objectContaining({
        virtualRows: [],
        totalCount: 0,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement: null,
      }),
    );
  });

  it('calls useInfiniteScroll with hasNextPage=false when not provided', () => {
    render(<Table {...defaultProps} />);

    expect(useInfiniteScroll).toHaveBeenCalledWith(
      expect.objectContaining({
        virtualRows: [],
        totalCount: 0,
        hasNextPage: false,
        isFetchingNextPage: false,
        scrollElement: null,
      }),
    );
  });

  it('creates a scroll container div with bounded height', () => {
    render(<Table {...defaultProps} />);

    const scrollContainer = screen.getByTestId('table-v2');
    expect(scrollContainer.tagName).toBe('DIV');
    expect(scrollContainer.style.overflow).toBe('auto');
    expect(scrollContainer.style.height).toBe('100%');
    expect(scrollContainer.style.minHeight).toBe('0');
  });

  it('passes columnWidths from computeColumnWidths to TableHeader', () => {
    const mockWidths = [{ id: 'name', type: 'flex' as const, widthPercent: 50 }];
    jest.mocked(computeColumnWidths).mockReturnValue(mockWidths);

    render(<Table {...defaultProps} />);

    expect(computeColumnWidths).toHaveBeenCalledWith(columns, ['name', 'id']);
  });
});
