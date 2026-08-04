import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';
import { dependencyRunsTableColumns } from '../dependency-runs-table-config';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

const makePipelineRun = (overrides: Partial<PipelineRunKind> = {}): PipelineRunKind => ({
  kind: 'PipelineRun',
  apiVersion: 'tekton.dev/v1beta1',
  metadata: {
    name: 'test-dependency-run',
    namespace: 'test-ns',
    creationTimestamp: '2023-01-01T00:00:00Z',
    uid: 'test-uid',
  },
  spec: {},
  status: {
    conditions: [{ status: 'True', type: 'Succeeded' }],
    startTime: '2023-01-01T00:00:00Z',
    completionTime: '2023-01-01T00:05:00Z',
  } as PipelineRunStatus,
  ...overrides,
});

const renderTable = (data: PipelineRunKind[]) =>
  render(
    <TableContainer data={data} unfilteredData={data} loaded={true}>
      <Table
        data={data}
        columns={dependencyRunsTableColumns}
        getRowId={(row) => row.metadata?.uid ?? row.metadata?.name ?? ''}
        aria-label="Dependency run list"
      />
    </TableContainer>,
  );

describe('Dependency runs column renderers', () => {
  beforeEach(() => {
    setupVirtualizerMock();
  });

  it('renders the pipeline run name', () => {
    renderTable([makePipelineRun()]);
    expect(screen.getByTestId('dependency-run-name')).toBeInTheDocument();
    expect(screen.getByTestId('dependency-run-name').textContent).toContain('test-dependency-run');
  });

  it('renders the status cell', () => {
    renderTable([makePipelineRun()]);
    expect(screen.getByTestId('dependency-run-status')).toBeInTheDocument();
    expect(screen.getByTestId('dependency-run-status')).toHaveTextContent('Succeeded');
  });

  it('renders started timestamp when startTime is present', () => {
    renderTable([makePipelineRun()]);
    expect(screen.getByTestId('dependency-run-started')).toBeInTheDocument();
  });

  it('renders duration when status is not Pending', () => {
    const run = makePipelineRun({
      status: {
        conditions: [{ status: 'True', type: 'Succeeded' }],
        startTime: '2023-01-01T00:00:00Z',
        completionTime: '2023-01-01T00:05:00Z',
      } as PipelineRunStatus,
    });
    renderTable([run]);
    const durationCell = screen.getByTestId('dependency-run-duration');
    expect(durationCell).toBeInTheDocument();
    expect(durationCell.textContent).not.toBe('-');
  });

  it('renders "-" for duration when status is Pending', () => {
    const run = makePipelineRun({
      status: {
        conditions: [{ status: 'Unknown', type: 'Succeeded', reason: 'PipelineRunPending' }],
      } as PipelineRunStatus,
    });
    renderTable([run]);
    expect(screen.getByTestId('dependency-run-duration')).toHaveTextContent('-');
  });

  it('renders elapsed duration when running with startTime but no completionTime', () => {
    const run = makePipelineRun({
      status: {
        conditions: [{ status: 'Unknown', type: 'Succeeded', reason: 'Running' }],
        startTime: '2023-01-01T00:00:00Z',
      } as PipelineRunStatus,
    });
    renderTable([run]);
    const durationCell = screen.getByTestId('dependency-run-duration');
    expect(durationCell).toBeInTheDocument();
    expect(durationCell.textContent).not.toBe('-');
  });

  it('renders empty started cell when startTime is absent', () => {
    const run = makePipelineRun({
      status: {
        conditions: [{ status: 'True', type: 'Succeeded' }],
        completionTime: '2023-01-01T00:05:00Z',
      } as PipelineRunStatus,
    });
    renderTable([run]);
    expect(screen.getByTestId('dependency-run-started')).toHaveTextContent('-');
  });

  it('renders "-" for duration when startTime is absent', () => {
    const run = makePipelineRun({
      status: {
        conditions: [{ status: 'True', type: 'Succeeded' }],
      } as PipelineRunStatus,
    });
    renderTable([run]);
    expect(screen.getByTestId('dependency-run-duration')).toHaveTextContent('-');
  });
});
