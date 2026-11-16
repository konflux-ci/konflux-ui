import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent } from 'storybook/test';
import { Table, type ColumnDefinition } from '~/shared/components/TableV2';
import { type PipelineRun, generateMockData, columns, getRowId } from './storyData';

const expandedContent = (row: PipelineRun) => (
  <div data-test="expanded-detail">
    <strong>{row.name}</strong> — Status: {row.status}, Component: {row.component}, Duration:{' '}
    {row.duration}
  </div>
);

const compoundColumns: ColumnDefinition<PipelineRun>[] = [
  columns[0],
  {
    ...columns[1],
    expandedContent: (row) => (
      <div data-test="status-expanded-detail">Status details for {row.name}</div>
    ),
  },
  {
    ...columns[2],
    expandedContent: (row) => (
      <div data-test="component-expanded-detail">Component details for {row.name}</div>
    ),
  },
  columns[3],
  columns[4],
];

const meta: Meta<typeof Table<PipelineRun>> = {
  title: 'TableV2/Expansion',
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

export const CompoundExpansion: Story = {
  args: {
    data: generateMockData(5),
    columns: compoundColumns,
    getRowId,
    'aria-label': 'Compound expansion',
  },
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    const compoundButtons = canvasElement.querySelectorAll(
      'button[aria-expanded="false"]',
    ) as NodeListOf<HTMLButtonElement>;
    await expect(compoundButtons.length).toBe(2);

    await userEvent.click(compoundButtons[0]);
    await expect(
      canvasElement.querySelector('[data-test="status-expanded-detail"]'),
    ).not.toBeNull();

    await userEvent.click(compoundButtons[1]);
    await expect(canvasElement.querySelector('[data-test="status-expanded-detail"]')).toBeNull();
    await expect(
      canvasElement.querySelector('[data-test="component-expanded-detail"]'),
    ).not.toBeNull();
  },
};
