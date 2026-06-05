import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { Table } from '~/shared/components/TableV2';
import {
  type PipelineRun,
  generateMockData,
  columns,
  getRowId,
  mixedWidthColumns,
} from './storyData';

const meta: Meta<typeof Table<PipelineRun>> = {
  title: 'TableV2/Table',
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

// --- Core Rendering ---

export const Basic: Story = {
  args: {
    data: generateMockData(20),
    columns,
    getRowId,
    'aria-label': 'Pipeline runs',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Table grid renders
    await expect(canvas.getByRole('grid')).toBeInTheDocument();

    // All column headers are present
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Status')).toBeInTheDocument();
    await expect(canvas.getByText('Component')).toBeInTheDocument();
    await expect(canvas.getByText('Started')).toBeInTheDocument();
    await expect(canvas.getByText('Duration')).toBeInTheDocument();

    // Data rows are visible (not just the header row)
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Verify actual cell content from mock data
    await expect(canvas.getByText('pipeline-run-0')).toBeInTheDocument();
    await expect(canvas.getByText('Succeeded')).toBeInTheDocument();
    await expect(canvas.getByText('frontend')).toBeInTheDocument();
  },
};

export const SingleRow: Story = {
  args: {
    data: generateMockData(1),
    columns,
    getRowId,
    'aria-label': 'Single row table',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBe(1);

    await expect(canvas.getByText('pipeline-run-0')).toBeInTheDocument();
  },
};

export const SingleColumn: Story = {
  args: {
    data: generateMockData(5),
    columns: [columns[0]],
    getRowId,
    'aria-label': 'Single column table',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Only the Name header should be present
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.queryByText('Status')).toBeNull();
    await expect(canvas.queryByText('Component')).toBeNull();

    // Data rows render
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBe(5);
  },
};

export const MixedColumnWidths: Story = {
  args: {
    data: generateMockData(10),
    columns: mixedWidthColumns,
    getRowId,
    'aria-label': 'Mixed width columns',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Table renders with data
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Headers present
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Status')).toBeInTheDocument();
  },
};

export const LargeDataset: Story = {
  args: {
    data: generateMockData(1000),
    columns,
    getRowId,
    'aria-label': 'Large dataset (1000 rows)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Table renders
    await expect(canvas.getByRole('grid')).toBeInTheDocument();

    // Data rows are visible (virtualization means NOT all 1000 are in DOM)
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);
    // Virtualization: far fewer than 1000 rows in the DOM
    await expect(rows.length).toBeLessThan(100);

    // First row content visible
    await expect(canvas.getByText('pipeline-run-0')).toBeInTheDocument();
  },
};
