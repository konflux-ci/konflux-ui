import { Table } from '@patternfly/react-table';
import { flexRender } from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import { type ColumnWidth } from '~/shared/components/TableV2/column-widths';
import { TableHeader } from '~/shared/components/TableV2/TableHeader';

jest.mock('@tanstack/react-table', () => ({
  ...jest.requireActual('@tanstack/react-table'),
  flexRender: jest.fn(() => 'Header'),
}));

const createMockTable = (
  headers: {
    id: string;
    header: string;
    canSort: boolean;
    isSorted: boolean | 'asc' | 'desc';
  }[],
) => ({
  getHeaderGroups: () => [
    {
      id: 'header-group-0',
      headers: headers.map((h) => ({
        id: h.id,
        colSpan: 1,
        isPlaceholder: false,
        column: {
          id: h.id,
          columnDef: { header: h.header },
          getCanSort: () => h.canSort,
          getIsSorted: () => h.isSorted,
          getToggleSortingHandler: () => jest.fn(),
          getNextSortingOrder: () => 'asc' as const,
        },
        getContext: () => ({}),
      })),
    },
  ],
});

const renderTableHeader = (ui: React.ReactElement) => render(<Table aria-label="test">{ui}</Table>);

describe('TableHeader', () => {
  beforeEach(() => {
    (flexRender as jest.Mock).mockClear();
  });

  const defaultHeaders = [
    { id: 'name', header: 'Name', canSort: true, isSorted: 'asc' as const },
    { id: 'status', header: 'Status', canSort: false, isSorted: false as const },
  ];

  const defaultWidths: ColumnWidth[] = [
    { id: 'name', type: 'flex', widthPercent: 60 },
    { id: 'status', type: 'flex', widthPercent: 40 },
  ];

  it('renders a Th for each header', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    expect(screen.getAllByText('Header')).toHaveLength(2);
    expect(flexRender).toHaveBeenCalledTimes(2);
  });

  it('sets data-test="table-header" on the Thead', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    expect(screen.getByTestId('table-header')).toBeInTheDocument();
  });

  it('renders ascending sort icon for sorted asc column', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    // Sorted column (Name, asc) should have sort indicator
    const sortIndicator = within(columnHeaders[0]).getByTestId('sort-indicator');
    expect(sortIndicator).toBeInTheDocument();
  });

  it('renders descending sort icon for sorted desc column', () => {
    const headers = [
      { id: 'name', header: 'Name', canSort: true, isSorted: 'desc' as const },
      { id: 'status', header: 'Status', canSort: false, isSorted: false as const },
    ];
    const table = createMockTable(headers);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    const sortIndicator = within(columnHeaders[0]).getByTestId('sort-indicator');
    expect(sortIndicator).toBeInTheDocument();
  });

  it('does not render sort icon on non-sorted columns', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    // Non-sortable column (Status) should NOT have sort indicator
    expect(within(columnHeaders[1]).queryByTestId('sort-indicator')).not.toBeInTheDocument();
  });

  it('sets aria-sort on sorted columns', () => {
    const headers = [
      { id: 'name', header: 'Name', canSort: true, isSorted: 'asc' as const },
      { id: 'status', header: 'Status', canSort: true, isSorted: 'desc' as const },
      { id: 'id', header: 'ID', canSort: false, isSorted: false as const },
    ];
    const widths: ColumnWidth[] = [
      { id: 'name', type: 'flex', widthPercent: 40 },
      { id: 'status', type: 'flex', widthPercent: 40 },
      { id: 'id', type: 'flex', widthPercent: 20 },
    ];
    const table = createMockTable(headers);
    renderTableHeader(<TableHeader table={table as never} columnWidths={widths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    expect(columnHeaders[0]).toHaveAttribute('aria-sort', 'ascending');
    expect(columnHeaders[1]).toHaveAttribute('aria-sort', 'descending');
    expect(columnHeaders[2]).not.toHaveAttribute('aria-sort');
  });

  it('does not render sort button (read-only indicators)', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    const thead = screen.getByTestId('table-header');
    // No interactive sort buttons — indicators are read-only
    expect(within(thead).queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies inline style for flex columns', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    expect(columnHeaders[0]).toHaveStyle({ width: '60%' });
  });

  it('applies inline style for fixed-width columns', () => {
    const fixedWidths: ColumnWidth[] = [
      { id: 'name', type: 'fixed', fixedWidth: '200px' },
      { id: 'status', type: 'flex', widthPercent: 100 },
    ];
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={fixedWidths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    expect(columnHeaders[0]).toHaveStyle({ width: '200px' });
  });

  it('renders an empty first Th when enableExpansion is true', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(
      <TableHeader table={table as never} columnWidths={defaultWidths} enableExpansion />,
    );

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    // expansion placeholder + 2 headers = 3
    expect(columnHeaders).toHaveLength(3);
  });

  it('does not render expansion placeholder when enableExpansion is false', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(2);
  });
});
