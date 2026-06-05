import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent } from 'storybook/test';
import { Table } from '~/shared/components/TableV2';
import { type PipelineRun, generateMockData, columns, getRowId } from './storyData';

const expandedContent = (row: PipelineRun) => (
  <div data-test="expanded-detail">
    <strong>{row.name}</strong> — Status: {row.status}, Component: {row.component}, Duration:{' '}
    {row.duration}
  </div>
);

const meta: Meta<typeof Table<PipelineRun>> = {
  title: 'TableV2/Expansion',
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

export const ExpandableRows: Story = {
  args: {
    data: generateMockData(10),
    columns,
    getRowId,
    'aria-label': 'Expandable rows',
    enableExpansion: true,
    expandedContent,
  },
  play: async ({ canvasElement }) => {
    // Data rows render
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // PF uses Td expand which renders a button with aria-expanded
    const expandButtons = canvasElement.querySelectorAll('button[aria-expanded]');
    await expect(expandButtons.length).toBeGreaterThan(0);

    // No expanded content visible initially
    const expandedDetails = canvasElement.querySelectorAll('[data-test="expanded-detail"]');
    await expect(expandedDetails.length).toBe(0);
  },
};

export const ToggleExpansion: Story = {
  args: {
    data: generateMockData(10),
    columns,
    getRowId,
    'aria-label': 'Toggle expansion',
    enableExpansion: true,
    expandedContent,
  },
  play: async ({ canvasElement }) => {
    // Wait for data rows
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Find first expand button
    const expandButtons = canvasElement.querySelectorAll(
      'button[aria-expanded="false"]',
    ) as NodeListOf<HTMLButtonElement>;
    await expect(expandButtons.length).toBeGreaterThan(0);

    // Click to expand the first row
    await userEvent.click(expandButtons[0]);

    // Expanded content should appear
    const expandedDetail = canvasElement.querySelector('[data-test="expanded-detail"]');
    await expect(expandedDetail).not.toBeNull();
    await expect(expandedDetail?.textContent).toContain('pipeline-run-0');

    // Click again to collapse
    const collapseButton = canvasElement.querySelector(
      'button[aria-expanded="true"]',
    ) as HTMLButtonElement;
    await expect(collapseButton).not.toBeNull();
    await userEvent.click(collapseButton);

    // Expanded content should disappear
    const expandedAfterCollapse = canvasElement.querySelectorAll('[data-test="expanded-detail"]');
    await expect(expandedAfterCollapse.length).toBe(0);
  },
};
