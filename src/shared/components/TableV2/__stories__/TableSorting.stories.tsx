import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { SortDropdown, Table } from '~/shared/components/TableV2';
import { generateMockData, columns, getRowId } from './storyData';

const COLUMN_STATE_KEY = 'storybook-sort-dropdown';

const meta: Meta = {
  title: 'TableV2/SortDropdown',
  decorators: [
    (Story) => (
      <div style={{ height: '600px', overflow: 'auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj;

export const SortDropdownDefault: Story = {
  render: () => (
    <div>
      <div style={{ padding: '8px 0' }}>
        <SortDropdown columns={columns} columnStateKey={COLUMN_STATE_KEY} />
      </div>
      <Table
        data={generateMockData(20)}
        columns={columns}
        getRowId={getRowId}
        aria-label="Sort dropdown demo"
        enableSorting
        columnStateKey={COLUMN_STATE_KEY}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Data rows render
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Open the sort dropdown (plain toggle with icon)
    const toggle = canvas.getByRole('button', { expanded: false });
    await userEvent.click(toggle);

    // Verify grouped options appear
    // "Sort by" group: Name, Status, Started (sortable columns)
    await expect(canvas.getByText('Sort by')).toBeInTheDocument();
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Status')).toBeInTheDocument();
    await expect(canvas.getByText('Started')).toBeInTheDocument();

    // "Direction" group: Ascending, Descending
    await expect(canvas.getByText('Direction')).toBeInTheDocument();
    await expect(canvas.getByText('Ascending')).toBeInTheDocument();
    await expect(canvas.getByText('Descending')).toBeInTheDocument();

    // Non-sortable columns should NOT appear in dropdown
    const componentOption = canvas.queryByRole('option', { name: 'Component' });
    await expect(componentOption).toBeNull();
    const durationOption = canvas.queryByRole('option', { name: 'Duration' });
    await expect(durationOption).toBeNull();
  },
};

export const SortByColumn: Story = {
  render: () => (
    <div>
      <div style={{ padding: '8px 0' }}>
        <SortDropdown columns={columns} columnStateKey={COLUMN_STATE_KEY} />
      </div>
      <Table
        data={generateMockData(20)}
        columns={columns}
        getRowId={getRowId}
        aria-label="Sort by column demo"
        enableSorting
        columnStateKey={COLUMN_STATE_KEY}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const getFirstRowName = () => {
      const firstRow = canvasElement.querySelector('[data-test="table-row"]');
      return firstRow?.textContent ?? '';
    };

    // Initial order
    const initialFirstRow = getFirstRowName();
    await expect(initialFirstRow).toContain('pipeline-run-0');

    // Open dropdown and select "Name" sort
    const toggle = canvas.getByRole('button', { expanded: false });
    await userEvent.click(toggle);
    await userEvent.click(canvas.getByRole('option', { name: 'Name' }));

    // Select "Descending" direction
    await userEvent.click(canvas.getByRole('option', { name: 'Descending' }));

    // Close dropdown by clicking toggle again
    await userEvent.click(canvas.getByRole('button', { expanded: true }));

    // After desc sort by name, "pipeline-run-9" comes first (lexicographic)
    const afterSortFirstRow = getFirstRowName();
    await expect(afterSortFirstRow).toContain('pipeline-run-9');
  },
};

export const ReadOnlySortIndicators: Story = {
  render: () => (
    <div>
      <div style={{ padding: '8px 0' }}>
        <SortDropdown columns={columns} columnStateKey={COLUMN_STATE_KEY} />
      </div>
      <Table
        data={generateMockData(20)}
        columns={columns}
        getRowId={getRowId}
        aria-label="Read-only indicators demo"
        enableSorting
        columnStateKey={COLUMN_STATE_KEY}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Headers should NOT have clickable sort buttons inside <th> elements
    const header = canvasElement.querySelector('[data-test="table-header"]')!;
    const thElements = header.querySelectorAll('th');
    for (const th of thElements) {
      const buttons = within(th as HTMLElement).queryAllByRole('button');
      await expect(buttons.length).toBe(0);
    }

    // Open dropdown and select a sort column to trigger an indicator
    const toggle = canvas.getByRole('button', { expanded: false });
    await userEvent.click(toggle);
    await userEvent.click(canvas.getByRole('option', { name: 'Name' }));

    // Close dropdown
    await userEvent.click(canvas.getByRole('button', { expanded: true }));

    // A sort indicator should now render for the sorted column
    const indicator = canvasElement.querySelector('[data-test="sort-indicator"]');
    await expect(indicator).not.toBeNull();

    // The indicator is a passive icon, NOT inside a button
    const indicatorButton = indicator?.closest('button');
    await expect(indicatorButton).toBeNull();
  },
};
