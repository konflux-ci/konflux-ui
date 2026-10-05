import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { getPipelineRunDetailsPath, getPipelineRunBreadcrumbs } from '../pipeline-run-routes';

const run = (labels?: Record<string, string>) => ({
  ...testPipelineRuns[DataState.SUCCEEDED],
  metadata: { name: 'build-1', namespace: 'team', labels },
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
