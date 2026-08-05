import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, fn } from 'storybook/test';
import { Table } from '~/shared/components/TableV2';
import { type PipelineRun, generateMockData, columns, getRowId } from './storyData';

const expandedContent = (row: PipelineRun) => (
  <div data-test="expanded-detail">
    <strong>{row.name}</strong> — {row.status} | {row.component} | {row.duration}
  </div>
);

const meta: Meta<typeof Table<PipelineRun>> = {
  title: 'TableV2/Selection',
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

// --- Basic Selection ---

export const SelectableRows: Story = {
  args: {
    data: generateMockData(10),
    columns,
    getRowId,
    'aria-label': 'Selectable rows',
    enableRowSelection: true,
    onRowSelectionChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Table renders
    await expect(canvas.getByRole('grid')).toBeInTheDocument();

    // Checkboxes render on rows
    const checkboxes = canvas.getAllByRole('checkbox');
    await expect(checkboxes.length).toBeGreaterThan(0);

    // Click the first checkbox to select
    await userEvent.click(checkboxes[0]);

    // Verify callback was invoked with selected row data
    await expect(args.onRowSelectionChange).toHaveBeenCalled();
    const lastCall = (args.onRowSelectionChange as ReturnType<typeof fn>).mock.calls.at(-1)!;
    await expect(lastCall[0]).toHaveLength(1);
    await expect(lastCall[0][0]).toHaveProperty('uid', 'uid-0');
  },
};

// --- Multiple Selection ---

export const MultipleSelection: Story = {
  args: {
    data: generateMockData(10),
    columns,
    getRowId,
    'aria-label': 'Multiple selection',
    enableRowSelection: true,
    onRowSelectionChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const checkboxes = within(canvasElement).getAllByRole('checkbox');
    await expect(checkboxes.length).toBeGreaterThanOrEqual(3);

    // Select three rows
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);
    await userEvent.click(checkboxes[2]);

    // The last call should include all 3 selected items
    const calls = (args.onRowSelectionChange as ReturnType<typeof fn>).mock.calls;
    const lastCall = calls[calls.length - 1];
    await expect(lastCall[0]).toHaveLength(3);
    await expect(lastCall[0].map((r: PipelineRun) => r.uid)).toEqual(
      expect.arrayContaining(['uid-0', 'uid-1', 'uid-2']),
    );
  },
};

// --- Deselect Row ---

export const DeselectRow: Story = {
  args: {
    data: generateMockData(10),
    columns,
    getRowId,
    'aria-label': 'Deselect row',
    enableRowSelection: true,
    onRowSelectionChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const checkboxes = within(canvasElement).getAllByRole('checkbox');

    // Select a row
    await userEvent.click(checkboxes[0]);
    await expect(checkboxes[0]).toBeChecked();

    // Deselect the same row
    await userEvent.click(checkboxes[0]);
    await expect(checkboxes[0]).not.toBeChecked();

    // Last callback should reflect empty selection
    const calls = (args.onRowSelectionChange as ReturnType<typeof fn>).mock.calls;
    const lastCall = calls[calls.length - 1];
    await expect(lastCall[0]).toHaveLength(0);
  },
};

// --- Selection With Sorting ---

export const SelectionWithSorting: Story = {
  render: () => {
    const data = generateMockData(10);
    return (
      <Table
        data={data}
        columns={columns}
        getRowId={getRowId}
        aria-label="Selection with sorting"
        enableRowSelection
        enableSorting
        columnStateKey="selection-sorting-story"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Select the first row
    const checkboxes = canvas.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await expect(checkboxes[0]).toBeChecked();

    // Remember which row we selected
    const firstRow = canvasElement.querySelector('[data-test="table-row"]')!;
    const selectedRowName = within(firstRow as HTMLElement).getByText('pipeline-run-0');
    await expect(selectedRowName).toBeInTheDocument();

    // Trigger sort by clicking the Name column sort button twice (descending)
    const nameHeader = canvas.getByText('Name');
    const nameTh = nameHeader.closest('th')!;
    const sortButton = within(nameTh as HTMLElement).getByRole('button');
    await userEvent.click(sortButton); // asc
    await userEvent.click(sortButton); // desc

    // After sorting, find the row containing pipeline-run-0 and verify it's still selected
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    let foundSelected = false;
    rows.forEach((row) => {
      if (row.textContent?.includes('pipeline-run-0')) {
        const checkbox = within(row as HTMLElement).getByRole('checkbox');
        expect(checkbox).toBeChecked();
        foundSelected = true;
      }
    });
    await expect(foundSelected).toBe(true);
  },
};

// --- Selection With Expansion ---

export const SelectionWithExpansion: Story = {
  args: {
    data: generateMockData(10),
    columns,
    getRowId,
    'aria-label': 'Selection with expansion',
    enableRowSelection: true,
    enableExpansion: true,
    expandedContent,
    onRowSelectionChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Select the first row
    const checkboxes = canvas.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await expect(checkboxes[0]).toBeChecked();

    // Expand a different row (second row)
    const expandButtons = canvasElement.querySelectorAll(
      'button[aria-expanded="false"]',
    ) as NodeListOf<HTMLButtonElement>;
    await expect(expandButtons.length).toBeGreaterThan(1);
    await userEvent.click(expandButtons[1]);

    // Expanded content should appear
    const expandedDetail = canvasElement.querySelector('[data-test="expanded-detail"]');
    await expect(expandedDetail).not.toBeNull();

    // First row should still be selected
    await expect(checkboxes[0]).toBeChecked();

    // Callback was called
    await expect(args.onRowSelectionChange).toHaveBeenCalled();
  },
};

// --- Consumer Pattern: Selected Rows Display ---

const SelectedRowsDisplayRender = () => {
  const data = generateMockData(10);
  const [selectedRows, setSelectedRows] = useState<PipelineRun[]>([]);
  return (
    <div>
      <div data-test="selection-count">Selected: {selectedRows.length} items</div>
      <Table
        data={data}
        columns={columns}
        getRowId={getRowId}
        aria-label="Selected rows display"
        enableRowSelection
        onRowSelectionChange={setSelectedRows}
      />
    </div>
  );
};

export const SelectedRowsDisplay: Story = {
  render: () => <SelectedRowsDisplayRender />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state: 0 items selected
    await expect(canvas.getByText('Selected: 0 items')).toBeInTheDocument();

    // Select two rows
    const checkboxes = canvas.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await expect(canvas.getByText('Selected: 1 items')).toBeInTheDocument();

    await userEvent.click(checkboxes[1]);
    await expect(canvas.getByText('Selected: 2 items')).toBeInTheDocument();
  },
};
