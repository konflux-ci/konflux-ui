import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from '~/shared/components/TableV2/Table';
import { type ColumnDefinition } from '~/shared/components/TableV2/types';

/**
 * Integration tests for row selection lifecycle.
 *
 * These tests render the real Table component (no mocked hooks)
 * to verify the full selection flow from checkbox click to callback.
 */

jest.mock('~/shared/hooks', () => ({
  getParentScrollableElement: jest.fn().mockReturnValue(null),
}));

// Mock virtualization to render all rows synchronously
jest.mock('~/shared/components/TableV2/hooks/useVirtualization', () => ({
  useVirtualization: ({ count }: { count: number }) => ({
    virtualizer: { getTotalSize: () => count * 44, measureElement: jest.fn() },
    virtualRows: Array.from({ length: count }, (_, i) => ({
      index: i,
      start: i * 44,
      size: 44,
      end: (i + 1) * 44,
      key: `row-${i}`,
      lane: 0,
    })),
  }),
}));

jest.mock('~/shared/components/TableV2/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: jest.fn(),
}));

interface TestRow {
  id: string;
  name: string;
  status: string;
}

const testData: TestRow[] = [
  { id: 'row-1', name: 'Alpha', status: 'active' },
  { id: 'row-2', name: 'Beta', status: 'inactive' },
  { id: 'row-3', name: 'Gamma', status: 'active' },
];

const columns: ColumnDefinition<TestRow>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name, sortable: true },
  { id: 'status', header: 'Status', accessorFn: (row) => row.status },
];

const defaultProps = {
  data: testData,
  columns,
  getRowId: (row: TestRow) => row.id,
  'aria-label': 'Selection test table',
  enableRowSelection: true,
} as const;

describe('Table selection lifecycle', () => {
  it('renders checkboxes when enableRowSelection is true', () => {
    render(<Table {...defaultProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('does not render checkboxes when enableRowSelection is false', () => {
    render(<Table {...defaultProps} enableRowSelection={false} />);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('selects a row when clicking its checkbox', async () => {
    const user = userEvent.setup();
    render(<Table {...defaultProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(checkboxes[0]).toBeChecked();
  });

  it('supports multiple row selection', async () => {
    const user = userEvent.setup();
    render(<Table {...defaultProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[2]);

    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it('fires onRowSelectionChange with correct TData[] when selection changes', async () => {
    const user = userEvent.setup();
    const onRowSelectionChange = jest.fn();
    render(<Table {...defaultProps} onRowSelectionChange={onRowSelectionChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(onRowSelectionChange).toHaveBeenCalledWith([testData[0]]);
  });

  it('fires onRowSelectionChange with all selected rows', async () => {
    const user = userEvent.setup();
    const onRowSelectionChange = jest.fn();
    render(<Table {...defaultProps} onRowSelectionChange={onRowSelectionChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    // Last call should contain both selected rows
    const lastCall = onRowSelectionChange.mock.calls[onRowSelectionChange.mock.calls.length - 1];
    expect(lastCall[0]).toEqual([testData[0], testData[1]]);
  });

  it('deselects a row when clicking its checkbox again', async () => {
    const user = userEvent.setup();
    const onRowSelectionChange = jest.fn();
    render(<Table {...defaultProps} onRowSelectionChange={onRowSelectionChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[0]);

    expect(checkboxes[0]).not.toBeChecked();
    // Last call should be empty selection
    const lastCall = onRowSelectionChange.mock.calls[onRowSelectionChange.mock.calls.length - 1];
    expect(lastCall[0]).toEqual([]);
  });

  it('selection is ephemeral — not persisted (no localStorage key involved)', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Table {...defaultProps} columnStateKey="test-table" />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    unmount();

    // Re-render — selection should be reset
    render(<Table {...defaultProps} columnStateKey="test-table" />);
    const newCheckboxes = screen.getAllByRole('checkbox');
    expect(newCheckboxes[0]).not.toBeChecked();
  });

  it('selection survives re-sort (same data, different order)', async () => {
    const user = userEvent.setup();
    render(<Table {...defaultProps} enableSorting />);

    // Select first row (Alpha)
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    // Click sort on the Name column header to trigger sort
    const sortButton = screen.getByRole('button', { name: /name/i });
    await user.click(sortButton);

    // After sorting, find the row with Alpha — it should still be selected
    const rows = screen.getAllByTestId('table-row');
    for (const row of rows) {
      const nameCell = within(row).queryByText('Alpha');
      if (nameCell) {
        const checkbox = within(row).getByRole('checkbox');
        expect(checkbox).toBeChecked();
      }
    }
  });

  it('selection persists when data reference changes but row IDs are stable', async () => {
    const user = userEvent.setup();
    const onRowSelectionChange = jest.fn();
    const { rerender } = render(
      <Table {...defaultProps} onRowSelectionChange={onRowSelectionChange} />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    // Re-render with new data reference (same content, different object)
    const newData = [...testData.map((row) => ({ ...row }))];
    rerender(
      <Table {...defaultProps} data={newData} onRowSelectionChange={onRowSelectionChange} />,
    );

    // Selection persists because TanStack tracks by row ID (getRowId), not array reference
    const newCheckboxes = screen.getAllByRole('checkbox');
    expect(newCheckboxes[0]).toBeChecked();
  });

  it('checkbox column is not part of columnState', () => {
    const { container } = render(<Table {...defaultProps} />);

    // The selection header should be an extra Th before data columns
    const thead = container.querySelector('[data-test="table-header"]');
    const columnHeaders = thead ? within(thead as HTMLElement).getAllByRole('columnheader') : [];

    // 1 selection Th + 2 data Ths = 3
    expect(columnHeaders).toHaveLength(3);
  });
});
