import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { type ColumnState } from '~/shared/components/TableV2';
import { ColumnManagementModal } from '../ColumnManagementModal';

const mockColumns = [
  { id: 'name', header: 'Name', nonHidable: true, pinned: 'start' as const },
  { id: 'status', header: 'Status' },
  { id: 'component', header: 'Component' },
  { id: 'started', header: 'Started' },
  { id: 'duration', header: 'Duration' },
  { id: 'actions', header: '', pinned: 'end' as const, nonHidable: true },
];

const allVisibleColumns = ['name', 'status', 'component', 'started', 'duration', 'actions'];

const defaultState: ColumnState = {
  visibleColumns: allVisibleColumns,
};

const meta: Meta<typeof ColumnManagementModal> = {
  title: 'Components/Modal/ColumnManagementModal',
  component: ColumnManagementModal,
  args: {
    columns: mockColumns,
    columnState: defaultState,
    defaultColumnState: defaultState,
    onSave: fn(),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ColumnManagementModal>;

export const AllVisible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkboxes = canvas.getAllByRole('checkbox');

    for (const checkbox of checkboxes) {
      await expect(checkbox).toBeChecked();
    }
  },
};

export const SomeHidden: Story = {
  args: {
    columnState: {
      visibleColumns: ['name', 'status', 'started', 'actions'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Visible columns should be checked
    await expect(canvas.getByLabelText('Name')).toBeChecked();
    await expect(canvas.getByLabelText('Status')).toBeChecked();
    await expect(canvas.getByLabelText('Started')).toBeChecked();

    // Hidden columns should be unchecked
    await expect(canvas.getByLabelText('Component')).not.toBeChecked();
    await expect(canvas.getByLabelText('Duration')).not.toBeChecked();
  },
};

export const WithPinnedColumns: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Pinned columns have disabled checkboxes
    const nameCheckbox = canvas.getByLabelText('Name');
    await expect(nameCheckbox).toBeDisabled();
    await expect(nameCheckbox).toBeChecked();

    // Pinned columns: the 'actions' column has an empty header, so find it by data-test
    const actionsRow = canvasElement.querySelector('[data-test="column-row-actions"]')!;
    const actionsCheckbox = within(actionsRow as HTMLElement).getByRole('checkbox');
    await expect(actionsCheckbox).toBeDisabled();

    // Pinned columns have disabled drag buttons
    const nameRow = canvasElement.querySelector('[data-test="column-row-name"]')!;
    const nameDragButton = within(nameRow as HTMLElement).getByRole('button', { name: /reorder/i });
    await expect(nameDragButton).toBeDisabled();

    const actionsDragButton = within(actionsRow as HTMLElement).getByRole('button', {
      name: /reorder/i,
    });
    await expect(actionsDragButton).toBeDisabled();

    // Unpinned column should have enabled checkbox
    await expect(canvas.getByLabelText('Status')).toBeEnabled();
  },
};

export const ResetToDefault: Story = {
  args: {
    columnState: defaultState,
    defaultColumnState: defaultState,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially all checkboxes are checked — toggle 'Component' off
    const componentCheckbox = canvas.getByLabelText('Component');
    await expect(componentCheckbox).toBeChecked();
    await userEvent.click(componentCheckbox);
    await expect(componentCheckbox).not.toBeChecked();

    // Click "Restore defaults"
    const restoreButton = canvas.getByRole('button', { name: /restore defaults/i });
    await userEvent.click(restoreButton);

    // Verify the checkbox is restored
    await expect(canvas.getByLabelText('Component')).toBeChecked();
  },
};
