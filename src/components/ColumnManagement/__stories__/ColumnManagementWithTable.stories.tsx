import React, { useState, useCallback, useMemo } from 'react';
import { Button, Modal } from '@patternfly/react-core';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import {
  Table,
  useColumnState,
  type ColumnDefinition,
  type ColumnState,
} from '~/shared/components/TableV2';
import { ColumnManagementModal } from '../ColumnManagementModal';

interface MockRow {
  id: string;
  name: string;
  status: string;
  component: string;
  started: string;
  duration: string;
  version: string;
  priority: string;
}

const generateData = (count: number): MockRow[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    name: `pipeline-run-${i}`,
    status: ['Succeeded', 'Failed', 'Running', 'Pending'][i % 4],
    component: ['frontend', 'backend', 'auth-service', 'database'][i % 4],
    started: new Date(2026, 5, 1, 4, 30 + i).toISOString(),
    duration: `${(i % 10) + 1}m`,
    version: `v${Math.floor(i / 10) + 1}.${i % 10}.0`,
    priority: ['High', 'Medium', 'Low'][i % 3],
  }));

const COLUMN_STATE_KEY = 'storybook-column-mgmt-demo';

const columns: ColumnDefinition<MockRow>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (r) => r.name,
    size: 2,
    sortable: true,
    nonHidable: true,
  },
  { id: 'status', header: 'Status', accessorFn: (r) => r.status, size: 1, sortable: true },
  { id: 'component', header: 'Component', accessorFn: (r) => r.component, size: 1 },
  { id: 'started', header: 'Started', accessorFn: (r) => r.started, size: 2, sortable: true },
  { id: 'duration', header: 'Duration', accessorFn: (r) => r.duration, size: 1 },
  { id: 'version', header: 'Version', accessorFn: (r) => r.version, size: 1 },
  { id: 'priority', header: 'Priority', accessorFn: (r) => r.priority, size: 1 },
];

const ColumnManagementDemo = () => {
  const data = useMemo(() => generateData(30), []);

  const { columnState, setColumnState } = useColumnState(COLUMN_STATE_KEY, columns);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultColumnState: ColumnState = useMemo(
    () => ({
      visibleColumns: columns.map((c) => c.id),
      columnOrder: columns.map((c) => c.id),
    }),
    [],
  );

  const columnInfoForModal = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        header: typeof c.header === 'string' ? c.header : c.id,
        nonHidable: c.nonHidable,
        pinned: c.pinned,
      })),
    [],
  );

  const handleSave = useCallback(
    (state: ColumnState) => {
      setColumnState(state);
      setIsModalOpen(false);
    },
    [setColumnState],
  );

  return (
    <div>
      <div style={{ padding: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
          data-test="open-column-mgmt"
        >
          Manage columns
        </Button>
        <span style={{ fontSize: '12px', color: '#666' }}>
          Visible: {columnState.visibleColumns.length} / {columns.length} columns
        </span>
      </div>
      <Table
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        aria-label="Column management demo"
        enableSorting
        columnStateKey={COLUMN_STATE_KEY}
      />
      <Modal
        title="Manage columns"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variant="small"
        data-test="column-management-modal"
      >
        <ColumnManagementModal
          columns={columnInfoForModal}
          columnState={columnState}
          defaultColumnState={defaultColumnState}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

const meta: Meta = {
  title: 'Components/Modal/ColumnManagementWithTable',
  decorators: [
    (Story) => (
      <div style={{ height: '500px', overflow: 'auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const Default: StoryObj = {
  render: () => <ColumnManagementDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Table renders with all columns
    await expect(canvas.getByRole('grid')).toBeInTheDocument();

    // All 7 column headers visible initially
    const headers = canvas.getAllByRole('columnheader');
    await expect(headers.length).toBe(7);
  },
};

export const HideAndRestore: StoryObj = {
  render: () => <ColumnManagementDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Open column management
    await user.click(canvas.getByTestId('open-column-mgmt'));

    // Uncheck 'Component' column
    const componentCheckbox = canvas.getByRole('checkbox', { name: 'Component' });
    await user.click(componentCheckbox);

    // Uncheck 'Version' column
    const versionCheckbox = canvas.getByRole('checkbox', { name: 'Version' });
    await user.click(versionCheckbox);

    // Save
    await user.click(canvas.getByRole('button', { name: /save/i }));

    // Table should now have 5 columns (7 - 2 hidden)
    const headers = canvas.getAllByRole('columnheader');
    await expect(headers.length).toBe(5);

    // Hidden columns should not be visible as headers
    const headerTexts = headers.map((h) => h.textContent);
    await expect(headerTexts).not.toContain('Component');
    await expect(headerTexts).not.toContain('Version');
  },
};
