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

  it('should render drag buttons for each column', () => {
    renderModal();
    expect(screen.getAllByRole('button', { name: /reorder/i })).toHaveLength(columns.length);
  });

  it('should disable drag button for pinned columns', () => {
    renderModal();
    const actionsRow = screen.getByTestId('column-row-actions');
    const dragButton = within(actionsRow).getByRole('button', { name: /reorder/i });
    expect(dragButton).toBeDisabled();
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
