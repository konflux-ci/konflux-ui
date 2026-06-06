import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { Table, TableContainer, TableSkeleton } from '~/shared/components/TableV2';
import { generateMockData, columns, getRowId } from './storyData';

const meta: Meta<typeof TableContainer> = {
  title: 'TableV2/TableContainer',
  component: TableContainer,
};

export default meta;

type Story = StoryObj<typeof TableContainer>;

export const Loading: Story = {
  render: () => (
    <TableContainer data={[]} unfilteredData={[]} loaded={false}>
      <Table data={[]} columns={columns} getRowId={getRowId} aria-label="Loading" />
    </TableContainer>
  ),
  play: async ({ canvasElement }) => {
    // Default skeleton renders
    const skeleton = canvasElement.querySelector('[data-test="table-skeleton"]');
    await expect(skeleton).not.toBeNull();

    // No actual table-v2 data test (table is not rendered — skeleton replaces children)
    const table = canvasElement.querySelector('[data-test="table-v2"]');
    await expect(table).toBeNull();
  },
};

export const LoadingCustomSkeleton: Story = {
  render: () => (
    <TableContainer
      data={[]}
      unfilteredData={[]}
      loaded={false}
      skeleton={<TableSkeleton columns={5} rows={8} />}
    >
      <Table data={[]} columns={columns} getRowId={getRowId} aria-label="Loading custom" />
    </TableContainer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const skeleton = canvasElement.querySelector('[data-test="table-skeleton"]');
    await expect(skeleton).not.toBeNull();

    // 5 header cells
    const headerRow = canvas.getAllByRole('row')[0];
    const headerCells = within(headerRow).getAllByRole('columnheader');
    await expect(headerCells).toHaveLength(5);

    // 1 header row + 8 body rows = 9
    const allRows = canvas.getAllByRole('row');
    await expect(allRows).toHaveLength(9);
  },
};

export const ErrorState: Story = {
  render: () => (
    <TableContainer
      data={[]}
      unfilteredData={[]}
      loaded={true}
      loadError={new Error('Failed to fetch pipeline runs')}
    >
      <Table data={[]} columns={columns} getRowId={getRowId} aria-label="Error" />
    </TableContainer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Error message renders
    await expect(canvas.getByText('Failed to fetch pipeline runs')).toBeInTheDocument();

    // Table is NOT rendered
    const table = canvasElement.querySelector('[data-test="table-v2"]');
    await expect(table).toBeNull();
  },
};

export const NoData: Story = {
  render: () => (
    <TableContainer
      data={[]}
      unfilteredData={[]}
      loaded={true}
      noDataState={
        <div data-test="no-data-state">No pipeline runs exist yet. Create one to get started.</div>
      }
    >
      <Table data={[]} columns={columns} getRowId={getRowId} aria-label="No data" />
    </TableContainer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('No pipeline runs exist yet. Create one to get started.'),
    ).toBeInTheDocument();

    // Table is NOT rendered
    const table = canvasElement.querySelector('[data-test="table-v2"]');
    await expect(table).toBeNull();
  },
};

export const FilteredEmpty: Story = {
  render: () => (
    <TableContainer
      data={[]}
      unfilteredData={generateMockData(10)}
      loaded={true}
      emptyState={
        <div data-test="empty-state">
          No results match the current filters. Try clearing filters.
        </div>
      }
    >
      <Table data={[]} columns={columns} getRowId={getRowId} aria-label="Filtered empty" />
    </TableContainer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('No results match the current filters. Try clearing filters.'),
    ).toBeInTheDocument();

    // Table is NOT rendered because data is empty (even though unfilteredData has items)
    const table = canvasElement.querySelector('[data-test="table-v2"]');
    await expect(table).toBeNull();
  },
};

export const WithData: Story = {
  render: () => {
    const data = generateMockData(10);
    return (
      <div style={{ height: '600px', overflow: 'auto' }}>
        <TableContainer data={data} unfilteredData={data} loaded={true}>
          <Table data={data} columns={columns} getRowId={getRowId} aria-label="With data" />
        </TableContainer>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Container renders
    const container = canvasElement.querySelector('[data-test="table-container"]');
    await expect(container).not.toBeNull();

    // Table renders with data rows
    await expect(canvas.getByRole('grid')).toBeInTheDocument();
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Actual data visible
    await expect(canvas.getByText('pipeline-run-0')).toBeInTheDocument();
  },
};

export const WithToolbar: Story = {
  render: () => {
    const data = generateMockData(10);
    return (
      <div style={{ height: '600px', overflow: 'auto' }}>
        <TableContainer
          data={data}
          unfilteredData={data}
          loaded={true}
          toolbar={
            <div data-test="toolbar" style={{ padding: '8px', borderBottom: '1px solid #d2d2d2' }}>
              Toolbar area — filters, search, actions
            </div>
          }
        >
          <Table data={data} columns={columns} getRowId={getRowId} aria-label="With toolbar" />
        </TableContainer>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Toolbar renders
    const toolbar = canvasElement.querySelector('[data-test="toolbar"]');
    await expect(toolbar).not.toBeNull();

    // Table renders below toolbar
    await expect(canvas.getByRole('grid')).toBeInTheDocument();
  },
};
