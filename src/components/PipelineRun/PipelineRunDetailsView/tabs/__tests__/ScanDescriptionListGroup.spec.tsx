import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind, TaskRunKind } from '~/types';
import { mockUseNamespaceHook, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { CVE_SCAN_RESULT } from '~/utils/scan/scan-utils';
import ScanDescriptionListGroup from '../ScanDescriptionListGroup';

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
});
