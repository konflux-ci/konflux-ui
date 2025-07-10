import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColumnManagement, { ColumnDefinition } from '../ColumnManagement';

type TestColumnKey = 'name' | 'created' | 'status' | 'kebab';

const testColumns: ColumnDefinition<TestColumnKey>[] = [
  { key: 'name', title: 'Name', className: 'name-class', sortable: true },
  { key: 'created', title: 'Created', className: 'created-class', sortable: true },
  { key: 'status', title: 'Status', className: 'status-class' },
  { key: 'kebab', title: '', className: 'kebab-class' },
];

const defaultVisibleColumns = new Set<TestColumnKey>(['name', 'created', 'status', 'kebab']);
const nonHidableColumns: TestColumnKey[] = ['name', 'kebab'];

describe('ColumnManagement', () => {
  const mockOnClose = jest.fn();
  const mockOnVisibleColumnsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with correct title and description', () => {
    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={testColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
        title="Test Columns"
        description="Test description"
      />,
    );

    expect(screen.getByText('Test Columns')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays checkboxes for manageable columns', () => {
    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={testColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />,
    );

    // Only manageable columns should be shown (not 'name' and 'kebab')
    expect(screen.getByLabelText('Created')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('')).not.toBeInTheDocument();
  });

  it('has correct initial checked state', () => {
    const visibleColumns = new Set<TestColumnKey>(['name', 'created', 'kebab']);

    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={testColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />,
    );

    expect(screen.getByLabelText('Created')).toBeChecked();
    expect(screen.getByLabelText('Status')).not.toBeChecked();
  });

  it('toggles column visibility when checkbox is clicked', () => {
    const visibleColumns = new Set<TestColumnKey>(['name', 'created', 'kebab']);

    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={testColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />,
    );

    // Toggle 'Status' column
    fireEvent.click(screen.getByLabelText('Status'));

    // Click Save button
    fireEvent.click(screen.getByText('Save'));

    expect(mockOnVisibleColumnsChange).toHaveBeenCalledWith(
      new Set(['name', 'created', 'kebab', 'status']),
    );
  });

  it('resets to default columns when reset button is clicked', () => {
    const visibleColumns = new Set<TestColumnKey>(['name', 'kebab']);

    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={testColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />,
    );

    // Click Reset button
    fireEvent.click(screen.getByText('Reset to default'));

    // Click Save button
    fireEvent.click(screen.getByText('Save'));

    expect(mockOnVisibleColumnsChange).toHaveBeenCalledWith(defaultVisibleColumns);
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={testColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when Save button is clicked', () => {
    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={testColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />,
    );

    fireEvent.click(screen.getByText('Save'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('uses default title and description when not provided', () => {
    render(
      <ColumnManagement
        isOpen={true}
        onClose={mockOnClose}
        visibleColumns={defaultVisibleColumns}
        onVisibleColumnsChange={mockOnVisibleColumnsChange}
        columns={testColumns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={nonHidableColumns}
      />,
    );

    expect(screen.getByText('Manage columns')).toBeInTheDocument();
    expect(
      screen.getByText('Selected columns will be displayed in the table.'),
    ).toBeInTheDocument();
  });
});
