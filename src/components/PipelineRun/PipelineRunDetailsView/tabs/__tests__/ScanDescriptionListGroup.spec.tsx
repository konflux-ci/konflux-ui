import { screen } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { PIPELINE_RUNS_VULNERABILITIES_PATH, TASKRUN_LOGS_PATH } from '~/routes/paths';
import { TektonResourceLabel, TaskRunKind } from '~/types';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import ScanDescriptionListGroup from '../ScanDescriptionListGroup';

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(() => 'test-ns'),
}));

const createTaskRun = (pipelineTask: string): TaskRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: {
      name: `${pipelineTask}-task-run`,
      namespace: 'test-ns',
      uid: `${pipelineTask}-uid`,
      labels: {
        [PipelineRunLabel.APPLICATION]: 'test-app',
        [PipelineRunLabel.PIPELINERUN_NAME]: 'pipeline-run-1',
        [TektonResourceLabel.pipelineTask]: pipelineTask,
      },
    },
    spec: {
      taskRef: { name: pipelineTask },
    },
    status: {
      results: [
        {
          name: 'CVE_SCAN_RESULT',
          value: JSON.stringify({
            vulnerabilities: { critical: 1, high: 2, medium: 3, low: 4, unknown: 0 },
          }),
        },
      ],
    },
  }) as TaskRunKind;

describe('ScanDescriptionListGroup', () => {
  it('links roxctl scans to the vulnerabilities view', () => {
    renderWithQueryClientAndRouter(
      <ScanDescriptionListGroup taskRuns={[createTaskRun(ROXCTL_SCAN_TASK)]} showLogsLink />,
    );

    const link = screen.getByRole('link', { name: 'View vulnerabilities' });
    expect(link).toHaveAttribute(
      'href',
      PIPELINE_RUNS_VULNERABILITIES_PATH.createPath({
        workspaceName: 'test-ns',
        applicationName: 'test-app',
        pipelineRunName: 'pipeline-run-1',
      }),
    );
    expect(screen.queryByRole('link', { name: 'View logs' })).not.toBeInTheDocument();
  });

  it('keeps the vulnerability link hidden while the PipelineRun is running', () => {
    renderWithQueryClientAndRouter(
      <ScanDescriptionListGroup
        taskRuns={[createTaskRun(ROXCTL_SCAN_TASK)]}
        showLogsLink
        showVulnerabilitiesLink={false}
      />,
    );

    expect(screen.queryByRole('link', { name: 'View vulnerabilities' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View logs' })).toBeInTheDocument();
  });

  it('keeps linking legacy scans to task logs', () => {
    renderWithQueryClientAndRouter(
      <ScanDescriptionListGroup taskRuns={[createTaskRun('clair-scan')]} showLogsLink />,
    );

    const link = screen.getByRole('link', { name: 'View logs' });
    expect(link).toHaveAttribute(
      'href',
      TASKRUN_LOGS_PATH.createPath({
        workspaceName: 'test-ns',
        applicationName: 'test-app',
        taskRunName: 'clair-scan-task-run',
      }),
    );
    expect(screen.queryByRole('link', { name: 'View vulnerabilities' })).not.toBeInTheDocument();
  });

  it('does not render a scan link when scan links are disabled', () => {
    renderWithQueryClientAndRouter(
      <ScanDescriptionListGroup taskRuns={[createTaskRun(ROXCTL_SCAN_TASK)]} />,
    );

    expect(screen.queryByRole('link', { name: 'View vulnerabilities' })).not.toBeInTheDocument();
  });

  it('handles incomplete TaskRun entries', () => {
    renderWithQueryClientAndRouter(
      <ScanDescriptionListGroup
        taskRuns={[undefined, createTaskRun(ROXCTL_SCAN_TASK)] as unknown as TaskRunKind[]}
      />,
    );

    expect(screen.getByText('Fixable vulnerabilities scan')).toBeInTheDocument();
  });
});
