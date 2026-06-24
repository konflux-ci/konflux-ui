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

  it('sets sort prop on sortable columns', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    // Sortable column (Name) should have aria-sort attribute
    expect(columnHeaders[0]).toHaveAttribute('aria-sort', 'ascending');
  });

  it('does not set sort on non-sortable columns', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    // Non-sortable column (Status) should NOT have aria-sort
    expect(columnHeaders[1]).not.toHaveAttribute('aria-sort');
  });

  it('applies width class for flex columns', () => {
    const table = createMockTable(defaultHeaders);
    renderTableHeader(<TableHeader table={table as never} columnWidths={defaultWidths} />);

    const thead = screen.getByTestId('table-header');
    const columnHeaders = within(thead).getAllByRole('columnheader');
    expect(columnHeaders[0]).toHaveClass('pf-m-width-60');
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
