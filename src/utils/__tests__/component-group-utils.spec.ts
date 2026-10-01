import { ComponentState } from '~/types';
import { getLatestPromotedBuild } from '~/utils/component-group-utils';

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
