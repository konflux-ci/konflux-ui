import * as React from 'react';
import { Table, Tbody, Tr } from '@patternfly/react-table';
import { render, screen } from '@testing-library/react';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { DependencyRunsListRow } from '../DependencyRunsListRow';

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
  },
  spec: {},
  status: {
    conditions: [{ status: 'True', type: 'Succeeded' }],
    startTime: '2023-01-01T00:00:00Z',
    completionTime: '2023-01-01T00:05:00Z',
  } as PipelineRunStatus,
  ...overrides,
});

const renderRow = (obj: PipelineRunKind) =>
  render(
    <Table>
      <Tbody>
        <Tr>
          <DependencyRunsListRow obj={obj} />
        </Tr>
      </Tbody>
    </Table>,
  );

describe('DependencyRunsListRow', () => {
  it('renders the pipeline run name', () => {
    renderRow(makePipelineRun());
    expect(screen.getByTestId('dependency-run-name')).toBeInTheDocument();
    expect(screen.getByTestId('dependency-run-name').textContent).toContain('test-dependency-run');
  });

  it('renders the status cell', () => {
    renderRow(makePipelineRun());
    expect(screen.getByTestId('dependency-run-status')).toBeInTheDocument();
    expect(screen.getByTestId('dependency-run-status')).toHaveTextContent('Succeeded');
  });

  it('renders started timestamp when startTime is present', () => {
    renderRow(makePipelineRun());
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
    renderRow(run);
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
    renderRow(run);
    expect(screen.getByTestId('dependency-run-duration')).toHaveTextContent('-');
  });

  it('renders elapsed duration when running with startTime but no completionTime', () => {
    const run = makePipelineRun({
      status: {
        conditions: [{ status: 'Unknown', type: 'Succeeded', reason: 'Running' }],
        startTime: '2023-01-01T00:00:00Z',
      } as PipelineRunStatus,
    });
    renderRow(run);
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
    renderRow(run);
    expect(screen.getByTestId('dependency-run-started')).toBeInTheDocument();
  });

  it('renders "-" for duration when startTime is absent', () => {
    const run = makePipelineRun({
      status: {
        conditions: [{ status: 'True', type: 'Succeeded' }],
      } as PipelineRunStatus,
    });
    renderRow(run);
    expect(screen.getByTestId('dependency-run-duration')).toHaveTextContent('-');
  });
});
