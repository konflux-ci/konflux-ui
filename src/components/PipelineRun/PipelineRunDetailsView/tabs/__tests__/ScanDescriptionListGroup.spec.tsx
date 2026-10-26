import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import {
  NAMESPACE_PIPELINE_RUN_VULNERABILITIES_PATH,
  PIPELINE_RUNS_VULNERABILITIES_PATH,
  TASKRUN_LOGS_PATH,
} from '~/routes/paths';
import { PipelineRunKind, TaskRunKind, TektonResourceLabel } from '~/types';
import { mockUseNamespaceHook, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { CVE_SCAN_RESULT } from '~/utils/scan/scan-utils';
import ScanDescriptionListGroup from '../ScanDescriptionListGroup';

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
          name: CVE_SCAN_RESULT,
          value: JSON.stringify({
            vulnerabilities: { critical: 1, high: 2, medium: 3, low: 4, unknown: 0 },
          }),
        },
      ],
    },
  }) as TaskRunKind;

describe('ScanDescriptionListGroup', () => {
  mockUseNamespaceHook('team');
  const parent: PipelineRunKind = {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: { name: 'build', namespace: 'team' },
    spec: {},
  };
  const task: TaskRunKind = {
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: { name: 'scan', namespace: 'team' },
    spec: {},
    status: {
      results: [{ name: CVE_SCAN_RESULT, value: JSON.stringify({ vulnerabilities: { high: 2 } }) }],
    },
  };

  it.each([
    [undefined, '/ns/team/pipelineruns/build/taskruns/scan/logs'],
    ['app', '/ns/team/applications/app/taskruns/scan/logs'],
  ])('links scan logs using the parent application context %s', (application, path) => {
    renderWithQueryClientAndRouter(
      <dl>
        <ScanDescriptionListGroup
          taskRuns={[task]}
          pipelineRun={{
            ...parent,
            metadata: {
              ...parent.metadata,
              labels: application ? { [PipelineRunLabel.APPLICATION]: application } : undefined,
            },
          }}
          showLogsLink
        />
      </dl>,
    );
    expect(screen.getByRole('link', { name: 'View logs' })).toHaveAttribute('href', path);
  });

  it('links every scan task in the popover to its nested logs', async () => {
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(
      <dl>
        <ScanDescriptionListGroup
          taskRuns={[task, { ...task, metadata: { ...task.metadata, name: 'scan-two' } }]}
          pipelineRun={parent}
          showLogsLink
          popoverAppendTo={false}
        />
      </dl>,
    );
    await user.click(screen.getByRole('button', { name: 'View logs' }));
    expect(
      screen.getAllByRole('link', { name: 'View logs' }).map((link) => link.getAttribute('href')),
    ).toEqual([
      '/ns/team/pipelineruns/build/taskruns/scan/logs',
      '/ns/team/pipelineruns/build/taskruns/scan-two/logs',
    ]);
  });

  it('omits logs links without an application or parent run', () => {
    renderWithQueryClientAndRouter(
      <dl>
        <ScanDescriptionListGroup taskRuns={[task]} showLogsLink />
      </dl>,
    );
    expect(screen.queryByRole('link', { name: 'View logs' })).not.toBeInTheDocument();
  });

  describe('vulnerability navigation', () => {
    it('links roxctl scans to the vulnerabilities view', () => {
      renderWithQueryClientAndRouter(
        <ScanDescriptionListGroup taskRuns={[createTaskRun(ROXCTL_SCAN_TASK)]} showLogsLink />,
      );

      const link = screen.getByRole('link', { name: 'View vulnerabilities' });
      expect(link).toHaveAttribute(
        'href',
        PIPELINE_RUNS_VULNERABILITIES_PATH.createPath({
          workspaceName: 'team',
          applicationName: 'test-app',
          pipelineRunName: 'pipeline-run-1',
        }),
      );
      expect(screen.queryByRole('link', { name: 'View logs' })).not.toBeInTheDocument();
    });

    it('uses the namespace vulnerabilities route for a component group pipeline run', () => {
      renderWithQueryClientAndRouter(
        <ScanDescriptionListGroup
          taskRuns={[createTaskRun(ROXCTL_SCAN_TASK)]}
          pipelineRun={{
            ...parent,
            metadata: {
              ...parent.metadata,
              labels: { [PipelineRunLabel.COMPONENT_GROUP]: 'test-group' },
            },
          }}
          showLogsLink
        />,
      );

      expect(screen.getByRole('link', { name: 'View vulnerabilities' })).toHaveAttribute(
        'href',
        NAMESPACE_PIPELINE_RUN_VULNERABILITIES_PATH.createPath({
          workspaceName: 'team',
          pipelineRunName: 'build',
        }),
      );
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
          workspaceName: 'team',
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
});
