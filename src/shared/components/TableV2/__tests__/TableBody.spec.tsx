import { Table } from '@patternfly/react-table';
import { render, screen, within } from '@testing-library/react';
import { TableBody } from '~/shared/components/TableV2/TableBody';
import { createMockRow, createMockVirtualRows } from '~/unit-test-utils';

jest.mock('~/shared/components/TableV2/TableRow', () => ({
  TableRow: ({ rowId }: { rowId: string }) => (
    <tr data-test="table-row" data-id={rowId}>
      <td>Row {rowId}</td>
    </tr>
  ),
}));

const renderTableBody = (props: Partial<React.ComponentProps<typeof TableBody>> = {}) => {
  const rows = props.rows ?? [createMockRow('r-0'), createMockRow('r-1'), createMockRow('r-2')];
  const virtualRows = props.virtualRows ?? createMockVirtualRows(rows.length);

  return render(
    <Table aria-label="test">
      <TableBody
        rows={rows as never[]}
        virtualRows={virtualRows}
        totalSize={rows.length * 44}
        getRowId={(row: { id: string }) => row.id}
        visibleColumnCount={3}
        {...props}
      />
    </Table>,
  );
};

describe('TableBody', () => {
  it('renders only the virtualized rows, not all rows', () => {
    const allRows = Array.from({ length: 10 }, (_, i) => createMockRow(`r-${i}`));
    const virtualRows = createMockVirtualRows(3); // only 3 virtual items

    renderTableBody({ rows: allRows as never[], virtualRows });

    const renderedRows = screen.getAllByTestId('table-row');
    expect(renderedRows).toHaveLength(3);
  });

  it('has data-test="table-body" on Tbody', () => {
    renderTableBody();

    expect(screen.getByTestId('table-body')).toBeInTheDocument();
  });

  it('passes correct rowId to each TableRow', () => {
    const rows = [createMockRow('app-1'), createMockRow('app-2')];
    const virtualRows = createMockVirtualRows(2);

    renderTableBody({ rows: rows as never[], virtualRows });

    const renderedRows = screen.getAllByTestId('table-row');
    expect(renderedRows[0]).toHaveAttribute('data-id', 'app-1');
    expect(renderedRows[1]).toHaveAttribute('data-id', 'app-2');
  });

  it('renders expanded content when row is expanded', () => {
    const rows = [createMockRow('r-0', { expanded: true })];
    const virtualRows = createMockVirtualRows(1);

    renderTableBody({
      rows: rows as never[],
      virtualRows,
      enableExpansion: true,
      expandedContent: (row: { id: string }) => (
        <div data-test="expanded">Details for {row.id}</div>
      ),
    });

    expect(screen.getByTestId('expanded')).toBeInTheDocument();
    expect(screen.getByText('Details for r-0')).toBeInTheDocument();
  });

  it('does not render expanded content when row is not expanded', () => {
    const rows = [createMockRow('r-0')];
    const virtualRows = createMockVirtualRows(1);

    renderTableBody({
      rows: rows as never[],
      virtualRows,
      enableExpansion: true,
      expandedContent: (row: { id: string }) => (
        <div data-test="expanded">Details for {row.id}</div>
      ),
    });

    expect(screen.queryByTestId('expanded')).not.toBeInTheDocument();
  });

  it('sets correct colspan on expanded content', () => {
    const rows = [createMockRow('r-0', { expanded: true })];
    const virtualRows = createMockVirtualRows(1);

    renderTableBody({
      rows: rows as never[],
      virtualRows,
      enableExpansion: true,
      visibleColumnCount: 5,
      expandedContent: () => <div>details</div>,
    });

    // The expanded row's Td should have colspan=5
    const expandedRow = screen.getByText('details').closest('tr') as HTMLElement;
    const td = within(expandedRow).getByRole('cell');
    expect(td).toHaveAttribute('colspan', '5');
  });

  it('renders 3 skeleton rows when isFetchingNextPage is true', () => {
    renderTableBody({ isFetchingNextPage: true, visibleColumnCount: 4 });

    const skeletonRows = screen.getAllByTestId('table-loading-more');
    expect(skeletonRows).toHaveLength(3);

    // Each skeleton row should have one skeleton per visible column
    skeletonRows.forEach((row) => {
      const skeletons = row.querySelectorAll('.pf-v5-c-skeleton');
      expect(skeletons).toHaveLength(4);
    });
  });

  it('does not render loading indicator when isFetchingNextPage is false', () => {
    renderTableBody({ isFetchingNextPage: false });

    expect(screen.queryByTestId('table-loading-more')).not.toBeInTheDocument();
  });
});
