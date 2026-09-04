import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { COMPONENT_DETAILS_PATH } from '~/routes/paths';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';
import { getDependencyRunsTableColumns } from '../dependency-runs-table-config';

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
    labels: {},
  },
  spec: {},
  status: {
    conditions: [{ status: 'True', type: 'Succeeded' }],
    startTime: '2023-01-01T00:00:00Z',
    completionTime: '2023-01-01T00:05:00Z',
  } as PipelineRunStatus,
  ...overrides,
});

const renderTable = (data: PipelineRunKind[], isSingleComponent = true) =>
  render(
    <TableContainer data={data} unfilteredData={data} loaded={true}>
      <Table
        data={data}
        columns={getDependencyRunsTableColumns('test-ns', 'test-application', isSingleComponent)}
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

  it('renders the component cell for application-level runs', () => {
    const run = makePipelineRun({
      metadata: {
        ...makePipelineRun().metadata,
        labels: {
          [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: 'component-alpha',
        },
      },
    });
    renderTable([run], false);
    expect(screen.getByRole('columnheader', { name: 'Component' })).toBeInTheDocument();
    const componentLink = screen.getByRole('link', { name: 'component-alpha' });
    expect(componentLink).toHaveAttribute(
      'href',
      COMPONENT_DETAILS_PATH.createPath({
        workspaceName: 'test-ns',
        applicationName: 'test-application',
        componentName: 'component-alpha',
      }),
    );
  });

  it('renders a fallback when an application-level run has no component label', () => {
    renderTable([makePipelineRun()], false);
    expect(screen.getByRole('columnheader', { name: 'Component' })).toBeInTheDocument();
    expect(screen.getByTestId('dependency-run-component')).toHaveTextContent('-');
  });

  it('renders a fallback when application-level run metadata has no labels', () => {
    const run = makePipelineRun({
      metadata: {
        ...makePipelineRun().metadata,
        labels: undefined,
      },
    });
    renderTable([run], false);
    expect(screen.getByTestId('dependency-run-component')).toHaveTextContent('-');
  });

  it('does not render the component column for component-level runs', () => {
    renderTable([makePipelineRun()]);
    expect(screen.queryByRole('columnheader', { name: 'Component' })).not.toBeInTheDocument();
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
