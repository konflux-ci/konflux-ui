import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Table } from '~/shared/components/TableV2';
import { type PipelineRun, generateMockData, columns, getRowId } from './storyData';

const meta: Meta<typeof Table<PipelineRun>> = {
  title: 'TableV2/Sorting',
  component: Table,
  decorators: [
    (Story) => (
      <div style={{ height: '600px', overflow: 'auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Table<PipelineRun>>;

export const SortableColumns: Story = {
  args: {
    data: generateMockData(20),
    columns,
    getRowId,
    'aria-label': 'Sortable pipeline runs',
    enableSorting: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Data rows render
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Sortable columns (Name, Status, Started) have sort buttons
    // Name header should have a sort button
    const nameHeader = canvas.getByText('Name');
    const nameTh = nameHeader.closest('th')!;
    const sortButton = within(nameTh as HTMLElement).getByRole('button');
    await expect(sortButton).toBeInTheDocument();

    // Non-sortable column (Component) should NOT have a sort button
    const componentHeader = canvas.getByText('Component');
    const componentTh = componentHeader.closest('th')!;
    const componentButtons = within(componentTh as HTMLElement).queryAllByRole('button');
    await expect(componentButtons.length).toBe(0);
  },
};

export const ClickToSort: Story = {
  args: {
    data: generateMockData(20),
    columns,
    getRowId,
    'aria-label': 'Click to sort',
    enableSorting: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get initial first data row content
    const getFirstRowName = () => {
      const firstRow = canvasElement.querySelector('[data-test="table-row"]');
      return firstRow?.textContent ?? '';
    };

    const initialFirstRow = getFirstRowName();
    await expect(initialFirstRow).toContain('pipeline-run-0');

    // Click the Name sort button to sort ascending
    const nameHeader = canvas.getByText('Name');
    const nameTh = nameHeader.closest('th')!;
    const sortButton = within(nameTh as HTMLElement).getByRole('button');
    await userEvent.click(sortButton);

    // After first click (asc sort), the first row should still be pipeline-run-0
    // because alphabetical sort of "pipeline-run-0" through "pipeline-run-19"
    // puts "pipeline-run-0" first (lexicographic: 0 < 1)
    const afterAscFirstRow = getFirstRowName();
    await expect(afterAscFirstRow).toContain('pipeline-run-0');

    // Click again to sort descending
    await userEvent.click(sortButton);

    // After desc sort, "pipeline-run-19" comes first
    // because TanStack uses alphanumeric sorting (19 > 9 numerically)
    const afterDescFirstRow = getFirstRowName();
    await expect(afterDescFirstRow).toContain('pipeline-run-19');
  },
};
