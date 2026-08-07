import { Table, Tbody } from '@patternfly/react-table';
import { flexRender } from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableRow } from '~/shared/components/TableV2';
import { createMockRow } from '~/unit-test-utils';

jest.mock('@tanstack/react-table', () => ({
  ...jest.requireActual('@tanstack/react-table'),
  flexRender: jest.fn((component, props) => {
    if (typeof component === 'function') return component(props);
    return component;
  }),
}));

const renderTableRow = (ui: React.ReactElement) =>
  render(
    <Table aria-label="test">
      <Tbody>{ui}</Tbody>
    </Table>,
  );

const mockMeasureElement = jest.fn();

describe('TableRow', () => {
  beforeEach(() => {
    (flexRender as jest.Mock).mockClear();
  });

  const mockCells = [
    { id: 'name', value: 'my-app', header: 'Name' },
    { id: 'status', value: 'Running', header: 'Status' },
  ];

  it('renders a Td for each visible cell', () => {
    const row = createMockRow('row-1', { cells: mockCells });
    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
      />,
    );

    expect(screen.getByText('my-app')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('sets data-test and data-id attributes on the row', () => {
    const row = createMockRow('row-1', { cells: mockCells });
    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
      />,
    );

    const tr = screen.getByTestId('table-row');
    expect(tr).toBeInTheDocument();
    expect(tr).toHaveAttribute('data-id', 'test-1');
  });

  it('sets dataLabel on each Td from column header', () => {
    const row = createMockRow('row-1', { cells: mockCells });
    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
      />,
    );

    const cells = screen.getAllByRole('cell');
    expect(cells[0]).toHaveAttribute('data-label', 'Name');
    expect(cells[1]).toHaveAttribute('data-label', 'Status');
  });

  it('calls flexRender with cell renderer and context', () => {
    const row = createMockRow('row-1', { cells: mockCells });
    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
      />,
    );

    expect(flexRender).toHaveBeenCalledTimes(2);
    expect(flexRender).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ getValue: expect.any(Function) }),
    );
  });

  it('renders expand toggle as first cell when enableExpansion is true', () => {
    const row = createMockRow('row-1', { cells: mockCells });
    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
        enableExpansion
      />,
    );

    const tr = screen.getByTestId('table-row');
    const cells = within(tr).getAllByRole('cell');
    // expand toggle + 2 data cells = 3
    expect(cells).toHaveLength(3);

    // first cell should be the expand toggle (has a button)
    const firstCell = cells[0];
    expect(within(firstCell).getByRole('button')).toBeInTheDocument();
  });

  it('does not render expand toggle when enableExpansion is false', () => {
    const row = createMockRow('row-1', { cells: mockCells });
    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
      />,
    );

    const tr = screen.getByTestId('table-row');
    const cells = within(tr).getAllByRole('cell');
    expect(cells).toHaveLength(2);
  });

  it('renders a checkbox cell when enableRowSelection is true', () => {
    const row = createMockRow('row-1', { cells: mockCells });
    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
        enableRowSelection
      />,
    );

    const tr = screen.getByTestId('table-row');
    const cells = within(tr).getAllByRole('cell');
    // checkbox + 2 data cells = 3
    expect(cells).toHaveLength(3);

    // first cell should contain a checkbox
    const firstCell = cells[0];
    expect(within(firstCell).getByRole('checkbox')).toBeInTheDocument();
  });

  it('does not render checkbox when enableRowSelection is false or omitted', () => {
    const row = createMockRow('row-1', { cells: mockCells });
    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
      />,
    );

    const tr = screen.getByTestId('table-row');
    expect(within(tr).queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('checkbox reflects row.getIsSelected() state', () => {
    const row = createMockRow('row-1', { cells: mockCells });
    // Mock getIsSelected to return true
    row.getIsSelected = jest.fn().mockReturnValue(true);

    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
        enableRowSelection
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls row.toggleSelected when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const toggleSelected = jest.fn();
    const row = createMockRow('row-1', { cells: mockCells });
    row.toggleSelected = toggleSelected;
    row.getIsSelected = jest.fn().mockReturnValue(false);

    renderTableRow(
      <TableRow
        row={row as never}
        rowId="test-1"
        virtualIndex={0}
        measureElement={mockMeasureElement}
        enableRowSelection
      />,
    );

    await user.click(screen.getByRole('checkbox'));
    expect(toggleSelected).toHaveBeenCalled();
  });
});
