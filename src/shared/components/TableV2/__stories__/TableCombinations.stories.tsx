import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { SortDropdown, Table } from '~/shared/components/TableV2';
import { type PipelineRun, generateMockData, columns, getRowId } from './storyData';

const COLUMN_STATE_KEY = 'storybook-combinations';

const expandedContent = (row: PipelineRun) => (
  <div data-test="expanded-detail">
    <strong>{row.name}</strong> — {row.status} | {row.component} | {row.duration}
  </div>
);

const meta: Meta = {
  title: 'TableV2/Combinations',
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

export const SortingAndExpansion: Story = {
  render: () => (
    <div>
      <div style={{ padding: '8px 0' }}>
        <SortDropdown columns={columns} columnStateKey={COLUMN_STATE_KEY} />
      </div>
      <Table
        data={generateMockData(20)}
        columns={columns}
        getRowId={getRowId}
        aria-label="Sort + Expand"
        enableSorting
        enableExpansion
        expandedContent={expandedContent}
        columnStateKey={COLUMN_STATE_KEY}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Data rows visible
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Expand a row
    const expandButtons = canvasElement.querySelectorAll(
      'button[aria-expanded="false"]',
    ) as NodeListOf<HTMLButtonElement>;
    // Filter to only expand/collapse toggle buttons (exclude dropdown toggle)
    const rowExpandButtons = Array.from(expandButtons).filter(
      (btn) => btn.closest('[data-test="table-row"]') !== null,
    );
    await expect(rowExpandButtons.length).toBeGreaterThan(0);
    await userEvent.click(rowExpandButtons[0]);

    // Expanded content visible
    const expanded = canvasElement.querySelector('[data-test="expanded-detail"]');
    await expect(expanded).not.toBeNull();

    // Sort via dropdown
    const toggle = canvas.getByRole('button', { expanded: false });
    await userEvent.click(toggle);
    await userEvent.click(canvas.getByRole('option', { name: 'Name' }));
    // Close dropdown
    await userEvent.click(canvas.getByRole('button', { expanded: true }));

    // Table still renders after sort
    const rowsAfterSort = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rowsAfterSort.length).toBeGreaterThan(0);
  },
};

export const FullFeatured: Story = {
  render: () => (
    <div>
      <div style={{ padding: '8px 0' }}>
        <SortDropdown columns={columns} columnStateKey={COLUMN_STATE_KEY} />
      </div>
      <Table
        data={generateMockData(50)}
        columns={columns}
        getRowId={getRowId}
        aria-label="Full featured table"
        enableSorting
        enableExpansion
        expandedContent={expandedContent}
        hasNextPage={false}
        isFetchingNextPage={false}
        columnStateKey={COLUMN_STATE_KEY}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Table renders with data
    await expect(canvas.getByRole('grid')).toBeInTheDocument();
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Virtualization: fewer than 50 rows in DOM
    await expect(rows.length).toBeLessThan(50);

    // Sort dropdown present (no sort buttons in headers)
    const header = canvasElement.querySelector('[data-test="table-header"]')!;
    const thElements = header.querySelectorAll('th');
    for (const th of thElements) {
      const buttons = within(th as HTMLElement).queryAllByRole('button');
      await expect(buttons.length).toBe(0);
    }

    // Expand buttons present
    const expandButtons = canvasElement.querySelectorAll('button[aria-expanded]');
    await expect(expandButtons.length).toBeGreaterThan(0);
  },
};
