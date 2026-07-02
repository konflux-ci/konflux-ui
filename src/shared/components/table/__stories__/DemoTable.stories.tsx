import React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

const COLUMNS = ['Name', 'Status', 'Created'] as const;

const MOCK_DATA = [
  { name: 'my-app-frontend', status: 'Running', created: '2026-06-01' },
  { name: 'my-app-backend', status: 'Running', created: '2026-06-01' },
  { name: 'my-app-database', status: 'Stopped', created: '2026-05-28' },
  { name: 'auth-service', status: 'Running', created: '2026-05-25' },
  { name: 'cache-layer', status: 'Error', created: '2026-05-20' },
];

const DemoTable: React.FC<{ isLoading?: boolean }> = ({ isLoading = false }) => (
  <Table aria-label="Demo table" data-test="demo-table">
    <Thead>
      <Tr>
        {COLUMNS.map((col) => (
          <Th key={col}>{col}</Th>
        ))}
      </Tr>
    </Thead>
    <Tbody>
      {isLoading
        ? Array.from({ length: 5 }, (_, i) => (
            <Tr key={i}>
              {COLUMNS.map((col) => (
                <Td key={col} dataLabel={col}>
                  <Skeleton screenreaderText="Loading" />
                </Td>
              ))}
            </Tr>
          ))
        : MOCK_DATA.map((row) => (
            <Tr key={row.name}>
              <Td dataLabel="Name">{row.name}</Td>
              <Td dataLabel="Status">{row.status}</Td>
              <Td dataLabel="Created">{row.created}</Td>
            </Tr>
          ))}
    </Tbody>
  </Table>
);

const meta: Meta<typeof DemoTable> = {
  title: 'Shared/DemoTable',
  component: DemoTable,
};

export default meta;

type Story = StoryObj<typeof DemoTable>;

export const Default: Story = {
  args: {
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Verify table renders with correct number of rows
    const rows = canvas.getAllByRole('row');
    // 1 header row + 5 data rows
    await expect(rows).toHaveLength(6);
    // Verify header text
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Status')).toBeInTheDocument();
    await expect(canvas.getByText('Created')).toBeInTheDocument();
    // Verify data renders
    await expect(canvas.getByText('my-app-frontend')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Verify skeleton elements render
    const rows = canvas.getAllByRole('row');
    await expect(rows).toHaveLength(6);
    // Header should still have text
    await expect(canvas.getByText('Name')).toBeInTheDocument();
  },
};
