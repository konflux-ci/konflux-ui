import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { TaskRunKind, TektonResourceLabel } from '~/types';
import {
  getPipelineRunDetailsPath,
  getPipelineRunBreadcrumbs,
  getTaskRunDetailsPath,
} from '../pipeline-run-routes';

const run = (labels?: Record<string, string>) => ({
  ...testPipelineRuns[DataState.SUCCEEDED],
  metadata: { name: 'build-1', namespace: 'team', labels },
});

describe('task run navigation', () => {
  const task: TaskRunKind = {
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: { name: 'compile', labels: { [TektonResourceLabel.pipelinerun]: 'build-1' } },
    spec: {},
  };

  it('uses the nested namespace route for a task in a run without an application', () => {
    expect(getTaskRunDetailsPath(task, 'team', run())).toBe(
      '/ns/team/pipelineruns/build-1/taskruns/compile',
    );
  });

  it('uses the parent application even when the task has no application label', () => {
    expect(
      getTaskRunDetailsPath(task, 'team', run({ [PipelineRunLabel.APPLICATION]: 'app' })),
    ).toBe('/ns/team/applications/app/taskruns/compile');
  });

  it('uses the known parent rather than conflicting task ownership labels', () => {
    expect(
      getTaskRunDetailsPath(
        {
          ...task,
          metadata: { ...task.metadata, labels: { [PipelineRunLabel.APPLICATION]: 'old-app' } },
        },
        'team',
        run(),
      ),
    ).toBe('/ns/team/pipelineruns/build-1/taskruns/compile');
  });

  it('uses task labels when no parent resource is available', () => {
    expect(getTaskRunDetailsPath(task, 'team')).toBe(
      '/ns/team/pipelineruns/build-1/taskruns/compile',
    );
  });

  it('does not invent a destination for an orphaned task', () => {
    expect(
      getTaskRunDetailsPath({ ...task, metadata: { name: 'orphan' } }, 'team'),
    ).toBeUndefined();
  });
});

describe('pipeline run navigation', () => {
  it('prefers the application route even when a group is present', () => {
    expect(
      getPipelineRunDetailsPath(
        run({
          [PipelineRunLabel.APPLICATION]: 'app',
          [PipelineRunLabel.COMPONENT_GROUP]: 'group',
        }),
      ),
    ).toBe('/ns/team/applications/app/pipelineruns/build-1');
  });

  it('opens the namespace route without an application label', () => {
    expect(getPipelineRunDetailsPath(run())).toBe('/ns/team/pipelineruns/build-1');
  });

  it('prefers group breadcrumbs over component breadcrumbs', () => {
    expect(
      getPipelineRunBreadcrumbs(
        run({
          [PipelineRunLabel.COMPONENT_GROUP]: 'group',
          [PipelineRunLabel.COMPONENT]: 'api',
        }),
      ),
    ).toEqual([
      { name: 'Groups', path: '/ns/team/groups' },
      { name: 'group', path: '/ns/team/groups/group' },
      { name: 'Pipeline runs', path: '/ns/team/groups/group/pipelineruns' },
      { name: 'build-1', path: '/ns/team/pipelineruns/build-1' },
    ]);
  });

  it('falls back to the component without inventing a version', () => {
    expect(getPipelineRunBreadcrumbs(run({ [PipelineRunLabel.COMPONENT]: 'api' }))).toEqual([
      { name: 'Components', path: '/ns/team/components' },
      { name: 'api', path: '/ns/team/components/api' },
      { name: 'Pipeline runs', path: '/ns/team/components/api/activity/pipelineruns' },
      { name: 'build-1', path: '/ns/team/pipelineruns/build-1' },
    ]);
  });

  it.each([
    undefined,
    {},
    { [PipelineRunLabel.COMPONENT_GROUP]: '', [PipelineRunLabel.COMPONENT]: '' },
  ])('omits breadcrumbs when ownership labels are absent: %s', (labels) => {
    expect(getPipelineRunBreadcrumbs(run(labels))).toBeUndefined();
  });
});
