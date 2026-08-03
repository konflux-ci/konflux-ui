import { buildGroupedOptions } from '~/shared/components/Filter';

type Item = { team: string; status?: string };

describe('buildGroupedOptions', () => {
  it('returns empty array for empty data', () => {
    const result = buildGroupedOptions<Item>(
      [],
      (item) => item.team,
      (item) => item.status,
    );
    expect(result).toEqual([]);
  });

  it('groups items into a single group', () => {
    const data: Item[] = [
      { team: 'Alpha', status: 'active' },
      { team: 'Alpha', status: 'pending' },
    ];
    const result = buildGroupedOptions(
      data,
      (item) => item.team,
      (item) => item.status,
    );
    expect(result).toEqual([
      {
        group: 'Alpha',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    ]);
  });

  it('groups items into multiple groups sorted alphabetically', () => {
    const data: Item[] = [
      { team: 'Beta', status: 'done' },
      { team: 'Alpha', status: 'active' },
      { team: 'Beta', status: 'pending' },
    ];
    const result = buildGroupedOptions(
      data,
      (item) => item.team,
      (item) => item.status,
    );
    expect(result).toEqual([
      {
        group: 'Alpha',
        options: [{ label: 'Active', value: 'active' }],
      },
      {
        group: 'Beta',
        options: [
          { label: 'Done', value: 'done' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    ]);
  });

  it('deduplicates options within a group', () => {
    const data: Item[] = [
      { team: 'Alpha', status: 'active' },
      { team: 'Alpha', status: 'active' },
      { team: 'Alpha', status: 'pending' },
    ];
    const result = buildGroupedOptions(
      data,
      (item) => item.team,
      (item) => item.status,
    );
    expect(result).toEqual([
      {
        group: 'Alpha',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    ]);
  });

  it('skips items where keyExtractor returns undefined', () => {
    const data: Item[] = [
      { team: 'Alpha', status: 'active' },
      { team: 'Alpha', status: undefined },
      { team: 'Alpha' },
    ];
    const result = buildGroupedOptions(
      data,
      (item) => item.team,
      (item) => item.status,
    );
    expect(result).toEqual([
      {
        group: 'Alpha',
        options: [{ label: 'Active', value: 'active' }],
      },
    ]);
  });

  it('uses custom labelFormatter', () => {
    const data: Item[] = [{ team: 'Alpha', status: 'active' }];
    const result = buildGroupedOptions(
      data,
      (item) => item.team,
      (item) => item.status,
      { labelFormatter: (v) => v.toUpperCase() },
    );
    expect(result).toEqual([
      {
        group: 'Alpha',
        options: [{ label: 'ACTIVE', value: 'active' }],
      },
    ]);
  });

  it('uses custom groupLabelFormatter', () => {
    const data: Item[] = [{ team: 'alpha', status: 'active' }];
    const result = buildGroupedOptions(
      data,
      (item) => item.team,
      (item) => item.status,
      { groupLabelFormatter: (g) => `Team: ${g}` },
    );
    expect(result).toEqual([
      {
        group: 'Team: alpha',
        options: [{ label: 'Active', value: 'active' }],
      },
    ]);
  });
});
