import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { ComponentReference, ComponentState, PipelineRunKind } from '~/types';
import {
  getLatestPromotedBuild,
  getComponentGroupVersionMap,
  filterPipelineRunsByComponentVersions,
} from '~/utils/component-group-utils';

const build = (overrides: Partial<ComponentState>): ComponentState => ({
  name: 'component',
  ...overrides,
});

describe('getLatestPromotedBuild', () => {
  it('should return undefined for an empty list', () => {
    expect(getLatestPromotedBuild([])).toBeUndefined();
  });

  it('should return the only build when there is one', () => {
    const only = build({ name: 'only', lastPromotedBuildTime: '2026-08-01T00:00:00Z' });

    expect(getLatestPromotedBuild([only])).toEqual(only);
  });

  it('should return the build with the latest promoted build time', () => {
    const older = build({ name: 'older', lastPromotedBuildTime: '2026-08-10T00:00:00Z' });
    const newer = build({
      name: 'newer',
      version: 'v2',
      lastPromotedBuildTime: '2026-08-20T00:00:00Z',
    });
    const middle = build({ name: 'middle', lastPromotedBuildTime: '2026-08-15T00:00:00Z' });

    expect(getLatestPromotedBuild([older, newer, middle])).toEqual(newer);
  });

  it('should keep the current latest when times are equal', () => {
    const first = build({ name: 'first', lastPromotedBuildTime: '2026-08-20T00:00:00Z' });
    const second = build({ name: 'second', lastPromotedBuildTime: '2026-08-20T00:00:00Z' });

    expect(getLatestPromotedBuild([first, second])).toEqual(first);
  });

  it('should prefer a timed candidate over a preceding untimed candidate', () => {
    const untimed = build({ name: 'untimed' });
    const timed = build({
      name: 'timed',
      version: 'v1',
      lastPromotedBuildTime: '2026-08-20T00:00:00Z',
    });

    expect(getLatestPromotedBuild([untimed, timed])).toEqual(timed);
  });

  it('should return the latest build for the requested component', () => {
    const older = build({
      name: 'component',
      version: 'v1',
      lastPromotedBuildTime: '2026-08-10T00:00:00Z',
    });
    const newer = build({
      name: 'component',
      version: 'v2',
      lastPromotedBuildTime: '2026-08-20T00:00:00Z',
    });
    const other = build({
      name: 'other',
      lastPromotedBuildTime: '2026-08-30T00:00:00Z',
    });

    expect(getLatestPromotedBuild([older, newer, other], 'component')).toEqual(newer);
  });

  it('should return the build for the requested version', () => {
    const v1 = build({
      name: 'component',
      version: 'v1',
      lastPromotedBuildTime: '2026-08-10T00:00:00Z',
    });
    const v2 = build({
      name: 'component',
      version: 'v2',
      lastPromotedBuildTime: '2026-08-20T00:00:00Z',
    });

    expect(getLatestPromotedBuild([v1, v2], 'component', 'v1')).toEqual(v1);
    expect(getLatestPromotedBuild([v1, v2], 'component', 'v3')).toBeUndefined();
  });

  it('should return an unversioned build when a version is requested', () => {
    const onlyVersion = build({
      name: 'component',
      lastPromotedBuildTime: '2026-08-10T00:00:00Z',
    });

    expect(getLatestPromotedBuild([onlyVersion], 'component', 'v1')).toEqual(onlyVersion);
  });
});

describe('component group pipeline run filtering', () => {
  const components: ComponentReference[] = [
    { name: 'frontend', componentVersion: { name: 'main', version: 'different-revision' } },
    { name: 'backend', componentVersion: { name: 'release' } },
    { name: 'frontend', componentVersion: { name: 'stable' } },
    { name: 'frontend', componentVersion: { name: 'main' } },
    { name: 'nested-group', kind: 'componentGroup' },
    { name: 'unversioned' },
  ];
  const run = (name: string, component?: string, version?: string): PipelineRunKind => ({
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name,
      labels: {
        ...(component && { [PipelineRunLabel.COMPONENT]: component }),
        ...(version && { [PipelineRunLabel.COMPONENT_VERSION]: version }),
      },
    },
    spec: {},
  });

  it('indexes unique component/version names, excluding nested groups and missing versions', () => {
    expect(getComponentGroupVersionMap(components)).toEqual(
      new Map([
        ['frontend', new Set(['main', 'stable'])],
        ['backend', new Set(['release'])],
      ]),
    );
    expect(getComponentGroupVersionMap([])).toEqual(new Map());
  });

  it('keeps exact pairs in input order and rejects the server selector cross product', () => {
    const frontend = run('frontend-build', 'frontend', 'main');
    const backend = run('backend-build', 'backend', 'release');
    const stable = run('frontend-stable', 'frontend', 'stable');
    const runs = [
      frontend,
      run('wrong-frontend-version', 'frontend', 'release'),
      backend,
      run('wrong-backend-version', 'backend', 'main'),
      stable,
      run('unknown-component', 'other', 'main'),
      run('revision-is-not-version', 'frontend', 'different-revision'),
    ];
    const original = [...runs];
    expect(
      filterPipelineRunsByComponentVersions(runs, getComponentGroupVersionMap(components)),
    ).toEqual([frontend, backend, stable]);
    expect(runs).toEqual(original);
  });

  it('rejects missing labels and returns no runs for an empty group', () => {
    const runs = [
      run('missing-version', 'frontend'),
      run('missing-component', undefined, 'main'),
      { ...run('missing-labels'), metadata: { name: 'missing-labels' } },
    ];
    expect(
      filterPipelineRunsByComponentVersions(runs, getComponentGroupVersionMap(components)),
    ).toEqual([]);
    expect(
      filterPipelineRunsByComponentVersions([run('build', 'frontend', 'main')], new Map()),
    ).toEqual([]);
  });

  it.each([PipelineRunType.BUILD, PipelineRunType.TEST, PipelineRunType.RELEASE])(
    'retains matching %s runs regardless of their component-group label',
    (type) => {
      const matching = run('matching', 'frontend', 'main');
      matching.metadata.labels[PipelineRunLabel.PIPELINE_TYPE] = type;
      matching.metadata.labels[PipelineRunLabel.COMPONENT_GROUP] = 'group';
      expect(
        filterPipelineRunsByComponentVersions([matching], getComponentGroupVersionMap(components)),
      ).toEqual([matching]);
    },
  );
});
