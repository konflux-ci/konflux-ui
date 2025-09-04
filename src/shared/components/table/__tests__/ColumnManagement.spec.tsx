import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColumnManagement, { ColumnDefinition } from '../ColumnManagement';

describe('ColumnManagement', () => {
  type TestColumnKeys = 'col1' | 'col2' | 'col3' | 'col4';

  const mockColumns: readonly ColumnDefinition<TestColumnKeys>[] = [
    { key: 'col1', title: 'Column 1' },
    { key: 'col2', title: 'Column 2' },
    { key: 'col3', title: 'Column 3' },
    { key: 'col4', title: 'Column 4' },
  ];

  const defaultVisibleColumns: Set<TestColumnKeys> = new Set(['col1', 'col2', 'col3']);
  const nonHidableColumns: readonly TestColumnKeys[] = ['col1'];

  const mockOnClose = jest.fn();
  const mockOnVisibleColumnsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal with correct title and description', () => {
    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={mockColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
        title="Test Column Management"
        description="Test description"
      />
    );

    expect(screen.getByText('Test Column Management')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should display checkboxes for all manageable columns', () => {
    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={mockColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />
    );

    // Should have checkboxes for manageable columns (excluding non-hidable ones)
    expect(screen.getByRole('checkbox', { name: 'Column 2' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Column 3' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Column 4' })).toBeInTheDocument();
  });

  it('should have correct initial checkbox states', () => {
    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={mockColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />
    );

    expect(screen.getByRole('checkbox', { name: 'Column 2' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Column 3' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Column 4' })).not.toBeChecked();
  });

  it('should toggle column visibility when checkbox is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={mockColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />
    );

    // Toggle Column 4 (should become checked)
    const col4Checkbox = screen.getByRole('checkbox', { name: 'Column 4' });
    await user.click(col4Checkbox);

    expect(col4Checkbox).toBeChecked();

    // Toggle Column 2 (should become unchecked)
    const col2Checkbox = screen.getByRole('checkbox', { name: 'Column 2' });
    await user.click(col2Checkbox);

    expect(col2Checkbox).not.toBeChecked();
  });

  it('should call onVisibleColumnsChange with updated columns when Save is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={mockColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />
    );

    // Toggle Column 4 to be visible
    const col4Checkbox = screen.getByRole('checkbox', { name: 'Column 4' });
    await user.click(col4Checkbox);

    // Click Save button
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    expect(mockOnVisibleColumnsChange).toHaveBeenCalledWith(
      new Set(['col1', 'col2', 'col3', 'col4'])
    );
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel is clicked without saving changes', async () => {
    const user = userEvent.setup();

    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={mockColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />
    );

    // Make some changes
    const col4Checkbox = screen.getByRole('checkbox', { name: 'Column 4' });
    await user.click(col4Checkbox);

    // Click Cancel button
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnVisibleColumnsChange).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should reset to default columns when Reset to default is clicked', async () => {
    const user = userEvent.setup();

    const customVisibleColumns = new Set<TestColumnKeys>(['col1', 'col4']);

    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={customVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={mockColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />
    );

    // Initially should show custom state
    expect(screen.getByRole('checkbox', { name: 'Column 2' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Column 3' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Column 4' })).toBeChecked();

    // Click Reset to default
    const resetButton = screen.getByRole('button', { name: 'Reset to default' });
    await user.click(resetButton);

    // Should now show default state
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Column 2' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Column 3' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Column 4' })).not.toBeChecked();
    });
  });

  it('should sync local state when modal opens with new visible columns', () => {
    const { rerender } = render(
      <ColumnManagement
        isOpen={false}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={mockColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />
    );

    const newVisibleColumns = new Set<TestColumnKeys>(['col1', 'col4']);

    // Reopen modal with different visible columns
    rerender(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={newVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={mockColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />
    );

    // Should reflect the new state
    expect(screen.getByRole('checkbox', { name: 'Column 2' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Column 3' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Column 4' })).toBeChecked();
  });

  it('should not allow unchecking non-hidable columns', async () => {
    const user = userEvent.setup();

    const columns: readonly ColumnDefinition<TestColumnKeys>[] = [
      { key: 'col1', title: 'Column 1' },
      { key: 'col2', title: 'Column 2' },
    ];

    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={new Set(['col1', 'col2'])}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={columns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />
    );

    // Column 1 should be disabled (non-hidable)
    const col1Checkbox = screen.getByRole('checkbox', { name: 'Column 1' });
    expect(col1Checkbox).toBeDisabled();
    expect(col1Checkbox).toBeChecked();

    // Column 2 should be enabled
    const col2Checkbox = screen.getByRole('checkbox', { name: 'Column 2' });
    expect(col2Checkbox).not.toBeDisabled();

    // Try to uncheck the non-hidable column (should have no effect)
    await user.click(col1Checkbox);
    expect(col1Checkbox).toBeChecked();
  });
});
