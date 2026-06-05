import { screen, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { type ColumnState } from '~/shared/components/TableV2';
import { ColumnManagementModal } from '../ColumnManagementModal';

const columns = [
  { id: 'name', header: 'Name', nonHidable: true },
  { id: 'status', header: 'Status' },
  { id: 'type', header: 'Type' },
  { id: 'created', header: 'Created' },
  { id: 'actions', header: 'Actions', pinned: 'end' as const },
];

const defaultColumnState: ColumnState = {
  visibleColumns: ['name', 'status', 'type', 'created', 'actions'],
};

describe('ColumnManagementModal', () => {
  afterEach(jest.clearAllMocks);

  const renderModal = (overrides: Partial<Parameters<typeof ColumnManagementModal>[0]> = {}) => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const props = {
      columns,
      columnState: { ...defaultColumnState },
      defaultColumnState,
      onSave,
      onClose,
      ...overrides,
    };
    render(<ColumnManagementModal {...props} />);
    return { onSave, onClose };
  };

  it('should render a checkbox for each column', () => {
    renderModal();
    columns.forEach((col) => {
      screen.getByRole('checkbox', { name: col.header });
    });
  });

  it('should toggle column visibility when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    // Uncheck 'Status'
    await user.click(screen.getByRole('checkbox', { name: 'Status' }));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        visibleColumns: expect.not.arrayContaining(['status']),
      }),
    );
  });

  it('should disable checkbox for nonHidable columns', () => {
    renderModal();
    const nameCheckbox = screen.getByRole('checkbox', { name: 'Name' });
    expect(nameCheckbox).toBeDisabled();
    expect(nameCheckbox).toBeChecked();
  });

  it('should disable checkbox for pinned columns', () => {
    renderModal();
    const actionsCheckbox = screen.getByRole('checkbox', { name: 'Actions' });
    expect(actionsCheckbox).toBeDisabled();
  });

  it('should move column up when up button is clicked', async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    // 'Type' is at index 2 (after name, status). Move it up.
    const typeRow = screen.getByTestId('column-row-type');
    await user.click(within(typeRow).getByRole('button', { name: 'Move up' }));

    await user.click(screen.getByRole('button', { name: /save/i }));

    const savedState = onSave.mock.calls[0][0] as ColumnState;
    const typeIndex = savedState.visibleColumns.indexOf('type');
    const statusIndex = savedState.visibleColumns.indexOf('status');
    expect(typeIndex).toBeLessThan(statusIndex);
  });

  it('should move column down when down button is clicked', async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    // 'Status' is at index 1. Move it down.
    const statusRow = screen.getByTestId('column-row-status');
    await user.click(within(statusRow).getByRole('button', { name: 'Move down' }));

    await user.click(screen.getByRole('button', { name: /save/i }));

    const savedState = onSave.mock.calls[0][0] as ColumnState;
    const statusIndex = savedState.visibleColumns.indexOf('status');
    const typeIndex = savedState.visibleColumns.indexOf('type');
    expect(statusIndex).toBeGreaterThan(typeIndex);
  });

  it('should disable reorder buttons for pinned columns', () => {
    renderModal();
    const actionsRow = screen.getByTestId('column-row-actions');
    const rowScope = within(actionsRow);

    expect(rowScope.getByRole('button', { name: 'Move up' })).toBeDisabled();
    expect(rowScope.getByRole('button', { name: 'Move down' })).toBeDisabled();
  });

  it('should reset to default column state when reset is clicked', async () => {
    const user = userEvent.setup();
    const customState: ColumnState = {
      visibleColumns: ['name', 'type', 'actions'],
    };
    const { onSave } = renderModal({ columnState: customState });

    // Status and Created should be unchecked initially
    expect(screen.getByRole('checkbox', { name: 'Status' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Created' })).not.toBeChecked();

    // Click reset
    await user.click(screen.getByRole('button', { name: /restore defaults/i }));

    // All should now be checked
    expect(screen.getByRole('checkbox', { name: 'Status' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Created' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(defaultColumnState);
  });

  it('should call onSave with new state when Save is clicked', async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(defaultColumnState);
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose without onSave when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
