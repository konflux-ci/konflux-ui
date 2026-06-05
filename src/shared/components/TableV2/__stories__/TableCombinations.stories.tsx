import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Table } from '~/shared/components/TableV2';
import { type PipelineRun, generateMockData, columns, getRowId } from './storyData';

const expandedContent = (row: PipelineRun) => (
  <div data-test="expanded-detail">
    <strong>{row.name}</strong> — {row.status} | {row.component} | {row.duration}
  </div>
);

const meta: Meta<typeof Table<PipelineRun>> = {
  title: 'TableV2/Combinations',
  component: Table,
  decorators: [
    (Story) => (
      <div style={{ height: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Table<PipelineRun>>;

export const SortingAndExpansion: Story = {
  args: {
    data: generateMockData(20),
    columns,
    getRowId,
    'aria-label': 'Sort + Expand',
    enableSorting: true,
    enableExpansion: true,
    expandedContent,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Data rows visible
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Expand a row
    const expandButtons = canvasElement.querySelectorAll(
      'button[aria-expanded="false"]',
    ) as NodeListOf<HTMLButtonElement>;
    await expect(expandButtons.length).toBeGreaterThan(0);
    await userEvent.click(expandButtons[0]);

    // Expanded content visible
    const expanded = canvasElement.querySelector('[data-test="expanded-detail"]');
    await expect(expanded).not.toBeNull();

    // Sort by name
    const nameHeader = canvas.getByText('Name');
    const nameTh = nameHeader.closest('th')!;
    const sortButton = within(nameTh as HTMLElement).getByRole('button');
    await userEvent.click(sortButton);

    // Table still renders after sort (expansion state may reset, that's OK)
    const rowsAfterSort = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rowsAfterSort.length).toBeGreaterThan(0);
  },
};

export const FullFeatured: Story = {
  args: {
    data: generateMockData(50),
    columns,
    getRowId,
    'aria-label': 'Full featured table',
    enableSorting: true,
    enableExpansion: true,
    expandedContent,
    hasNextPage: false,
    isFetchingNextPage: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Table renders with data
    await expect(canvas.getByRole('grid')).toBeInTheDocument();
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Virtualization: fewer than 50 rows in DOM
    await expect(rows.length).toBeLessThan(50);

    // Sort buttons present
    const nameHeader = canvas.getByText('Name');
    const nameTh = nameHeader.closest('th')!;
    const sortButton = within(nameTh as HTMLElement).queryByRole('button');
    await expect(sortButton).not.toBeNull();

    // Expand buttons present
    const expandButtons = canvasElement.querySelectorAll('button[aria-expanded]');
    await expect(expandButtons.length).toBeGreaterThan(0);
  },
};
