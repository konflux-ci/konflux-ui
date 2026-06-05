import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Table, TableContainer, type ColumnDefinition } from '~/shared/components/TableV2';

interface PipelineRun {
  uid: string;
  name: string;
  status: string;
  component: string;
  started: string;
  duration: string;
}

const generateMockData = (count: number): PipelineRun[] =>
  Array.from({ length: count }, (_, i) => ({
    uid: `uid-${i}`,
    name: `pipeline-run-${i}`,
    status: ['Succeeded', 'Failed', 'Running', 'Pending'][i % 4],
    component: ['frontend', 'backend', 'auth-service', 'database'][i % 4],
    started: new Date(2026, 5, 1, 10, i).toISOString(),
    duration: `${(i % 10) + 1}m`,
  }));

const columns: ColumnDefinition<PipelineRun>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.name,
    size: 3,
    sortable: true,
    nonHidable: true,
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => row.status,
    size: 2,
    sortable: true,
    visibleFrom: 'md',
  },
  {
    id: 'component',
    header: 'Component',
    accessorFn: (row) => row.component,
    size: 2,
    visibleFrom: 'lg',
  },
  {
    id: 'started',
    header: 'Started',
    accessorFn: (row) => row.started,
    size: 2,
    sortable: true,
    visibleFrom: 'xl',
  },
  {
    id: 'duration',
    header: 'Duration',
    accessorFn: (row) => row.duration,
    size: 1,
    visibleFrom: 'xl',
  },
];

const getRowId = (row: PipelineRun) => row.uid;

const meta: Meta<typeof Table> = {
  title: 'TableV2/Table',
  component: Table,
};

export default meta;

type Story = StoryObj<typeof Table<PipelineRun>>;

// --- Basic ---

export const Basic: Story = {
  args: {
    data: generateMockData(20),
    columns,
    getRowId,
    'aria-label': 'Pipeline runs',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // table renders
    await expect(canvas.getByRole('table')).toBeInTheDocument();

    // headers present
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Status')).toBeInTheDocument();

    // rows rendered (at least some visible via virtualization)
    const rows = canvas.getAllByRole('row');
    // 1 header row + at least 1 data row
    await expect(rows.length).toBeGreaterThan(1);
  },
};

// --- WithSorting ---

export const WithSorting: Story = {
  args: {
    data: generateMockData(20),
    columns,
    getRowId,
    'aria-label': 'Pipeline runs with sorting',
    enableSorting: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // sortable columns render sort buttons
    const nameHeader = canvas.getByText('Name');
    await expect(nameHeader.closest('th')).toBeInTheDocument();

    // click the Name header to trigger sort
    const sortButton = canvas
      .getAllByRole('button')
      .find((btn) => btn.textContent?.includes('Name'));
    if (sortButton) {
      await userEvent.click(sortButton);
    }

    // table still renders after sort interaction
    await expect(canvas.getByRole('table')).toBeInTheDocument();
  },
};

// --- WithExpansion ---

export const WithExpansion: Story = {
  args: {
    data: generateMockData(20),
    columns,
    getRowId,
    'aria-label': 'Pipeline runs with expansion',
    enableExpansion: true,
    expandedContent: (row: PipelineRun) => (
      <div data-test="expanded-detail">
        <strong>{row.name}</strong> — Status: {row.status}, Component: {row.component}, Duration:{' '}
        {row.duration}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // expand toggle buttons present
    const toggleButtons = canvas.getAllByRole('button', { name: /expand row/i });
    await expect(toggleButtons.length).toBeGreaterThan(0);

    // click first expand toggle
    await userEvent.click(toggleButtons[0]);

    // expanded content appears
    await expect(canvas.getByText(/pipeline-run-0/)).toBeInTheDocument();
  },
};

// --- WithTableContainer: Loading ---

export const Loading: Story = {
  render: () => (
    <TableContainer data={[]} unfilteredData={[]} loaded={false}>
      <Table data={[]} columns={columns} getRowId={getRowId} aria-label="Pipeline runs loading" />
    </TableContainer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // skeleton renders when not loaded
    const skeleton = canvas.getByTestId
      ? canvasElement.querySelector('[data-test="table-skeleton"]')
      : canvasElement.querySelector('[data-test="table-skeleton"]');
    await expect(skeleton).toBeInTheDocument();
  },
};

// --- WithTableContainer: Empty ---

export const Empty: Story = {
  render: () => (
    <TableContainer
      data={[]}
      unfilteredData={generateMockData(5)}
      loaded={true}
      emptyState={<div data-test="empty-state">No results match the current filters.</div>}
    >
      <Table data={[]} columns={columns} getRowId={getRowId} aria-label="Pipeline runs empty" />
    </TableContainer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No results match the current filters.')).toBeInTheDocument();
  },
};

// --- WithTableContainer: WithData ---

export const WithData: Story = {
  render: () => {
    const data = generateMockData(10);
    return (
      <TableContainer data={data} unfilteredData={data} loaded={true}>
        <Table
          data={data}
          columns={columns}
          getRowId={getRowId}
          aria-label="Pipeline runs with data"
        />
      </TableContainer>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // table container present
    const container = canvasElement.querySelector('[data-test="table-container"]');
    await expect(container).toBeInTheDocument();

    // table renders inside container
    await expect(canvas.getByRole('table')).toBeInTheDocument();

    // data rows visible
    const rows = canvas.getAllByRole('row');
    await expect(rows.length).toBeGreaterThan(1);
  },
};

// --- LargeDataset ---

export const LargeDataset: Story = {
  args: {
    data: generateMockData(1000),
    columns,
    getRowId,
    'aria-label': 'Pipeline runs large dataset',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // table renders without crashing
    await expect(canvas.getByRole('table')).toBeInTheDocument();

    // some data rows visible (virtualization means far fewer than 1000 in DOM)
    const rows = canvas.getAllByRole('row');
    await expect(rows.length).toBeGreaterThan(1);
    await expect(rows.length).toBeLessThan(1000);
  },
};
