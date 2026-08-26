import { MOCK_COMPONENT_GROUPS } from '~/components/ComponentGroups/ComponentGroupsListView/__data__/mockComponentGroups';
import {
  enrichComponentGroupsForTable,
  getLatestPromotedBuild,
} from '~/components/ComponentGroups/ComponentGroupsListView/component-groups-table-config';
import { ComponentState } from '~/types';

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
});

describe('enrichComponentGroupsForTable', () => {
  it('should attach the latest promoted build from globalCandidateList', () => {
    const [frontendStack] = enrichComponentGroupsForTable([MOCK_COMPONENT_GROUPS[0]]);

    expect(frontendStack.latestPromotedBuild).toEqual(
      expect.objectContaining({
        name: 'konflux-ui',
        version: 'v1.2.0',
        lastPromotedBuildTime: '2026-08-20T14:22:00Z',
      }),
    );
  });

  it('should leave latestPromotedBuild undefined when there are no candidates', () => {
    const platformOperators = MOCK_COMPONENT_GROUPS.find(
      (group) => group.metadata.name === 'platform-operators',
    );

    const [enriched] = enrichComponentGroupsForTable([platformOperators]);

    expect(enriched.latestPromotedBuild).toBeUndefined();
  });
});
