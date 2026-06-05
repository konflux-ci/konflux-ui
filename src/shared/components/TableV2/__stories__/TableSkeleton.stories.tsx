import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { TableSkeleton } from '~/shared/components/TableV2';

const meta: Meta<typeof TableSkeleton> = {
  title: 'TableV2/TableSkeleton',
  component: TableSkeleton,
};

export default meta;

type Story = StoryObj<typeof TableSkeleton>;

export const ThreeColumns: Story = {
  args: {
    columns: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const headerRow = canvas.getAllByRole('row')[0];
    const headerCells = within(headerRow).getAllByRole('columnheader');
    await expect(headerCells).toHaveLength(3);

    // 1 header row + 5 default body rows
    const allRows = canvas.getAllByRole('row');
    await expect(allRows).toHaveLength(6);

    // screenreaderText on first skeleton
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

export const EightColumns: Story = {
  args: {
    columns: 8,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const headerRow = canvas.getAllByRole('row')[0];
    const headerCells = within(headerRow).getAllByRole('columnheader');
    await expect(headerCells).toHaveLength(8);

    await expect(canvas.getByText('Loading table')).toBeInTheDocument();
  },
};

export const CustomRowCount: Story = {
  args: {
    columns: 3,
    rows: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 1 header row + 3 body rows
    const allRows = canvas.getAllByRole('row');
    await expect(allRows).toHaveLength(4);

    const headerRow = allRows[0];
    const headerCells = within(headerRow).getAllByRole('columnheader');
    await expect(headerCells).toHaveLength(3);

    await expect(canvas.getByText('Loading table')).toBeInTheDocument();
  },
};
