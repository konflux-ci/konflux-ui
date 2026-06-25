import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { TableSkeleton } from '~/shared/components/TableV2';

const meta: Meta<typeof TableSkeleton> = {
  title: 'TableV2/TableSkeleton',
  component: TableSkeleton,
};

export default meta;

type Story = StoryObj<typeof TableSkeleton>;

export const Default: Story = {
  args: {
    columns: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Has the data-test marker
    const skeleton = canvasElement.querySelector('[data-test="table-skeleton"]');
    await expect(skeleton).not.toBeNull();

    // 3 header cells
    const headerRow = canvas.getAllByRole('row')[0];
    const headerCells = within(headerRow).getAllByRole('columnheader');
    await expect(headerCells).toHaveLength(3);

    // 1 header + 5 default body rows = 6
    const allRows = canvas.getAllByRole('row');
    await expect(allRows).toHaveLength(6);

    // Accessibility: screenreader text
    await expect(canvas.getByText('Loading table')).toBeInTheDocument();
  },
};

export const FiveColumns: Story = {
  args: {
    columns: 5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const headerRow = canvas.getAllByRole('row')[0];
    const headerCells = within(headerRow).getAllByRole('columnheader');
    await expect(headerCells).toHaveLength(5);

    await expect(canvas.getByText('Loading table')).toBeInTheDocument();
  },
};

export const CustomRowCount: Story = {
  args: {
    columns: 4,
    rows: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1 header + 3 body rows = 4
    const allRows = canvas.getAllByRole('row');
    await expect(allRows).toHaveLength(4);

    const headerRow = allRows[0];
    const headerCells = within(headerRow).getAllByRole('columnheader');
    await expect(headerCells).toHaveLength(4);
  },
};
