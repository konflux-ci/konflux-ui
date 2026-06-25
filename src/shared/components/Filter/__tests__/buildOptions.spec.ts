import { buildOptions, buildOptionsWithFallback, NONE_VALUE } from '~/shared/components/Filter';

type Item = { status?: string | null };

const keyExtractor = (item: Item) => item.status ?? undefined;

describe('buildOptions', () => {
  it('extracts unique values from data', () => {
    const data: Item[] = [{ status: 'active' }, { status: 'pending' }, { status: 'active' }];
    const result = buildOptions(data, keyExtractor);
    expect(result).toEqual([
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
    ]);
  });

  it('sorts alphabetically by label', () => {
    const data: Item[] = [{ status: 'zebra' }, { status: 'alpha' }, { status: 'mid' }];
    const result = buildOptions(data, keyExtractor);
    expect(result).toEqual([
      { label: 'Alpha', value: 'alpha' },
      { label: 'Mid', value: 'mid' },
      { label: 'Zebra', value: 'zebra' },
    ]);
  });

  it('deduplicates values', () => {
    const data: Item[] = [
      { status: 'done' },
      { status: 'done' },
      { status: 'done' },
      { status: 'pending' },
    ];
    const result = buildOptions(data, keyExtractor);
    expect(result).toEqual([
      { label: 'Done', value: 'done' },
      { label: 'Pending', value: 'pending' },
    ]);
  });

  it('skips undefined/null values from extractor', () => {
    const data: Item[] = [{ status: 'active' }, { status: undefined }, { status: null }, {}];
    const result = buildOptions(data, keyExtractor);
    expect(result).toEqual([{ label: 'Active', value: 'active' }]);
  });

  it('constrains to validKeys when provided', () => {
    const data: Item[] = [{ status: 'active' }, { status: 'pending' }, { status: 'unknown' }];
    const result = buildOptions(data, keyExtractor, {
      validKeys: ['active', 'pending', 'archived'],
    });
    expect(result).toEqual([
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
    ]);
  });

  it('uses labelFormatter when provided', () => {
    const data: Item[] = [{ status: 'active' }, { status: 'pending' }];
    const result = buildOptions(data, keyExtractor, {
      labelFormatter: (v) => v.toUpperCase(),
    });
    expect(result).toEqual([
      { label: 'ACTIVE', value: 'active' },
      { label: 'PENDING', value: 'pending' },
    ]);
  });

  it('returns empty array for empty data', () => {
    const result = buildOptions([], keyExtractor);
    expect(result).toEqual([]);
  });
});

describe('buildOptionsWithFallback', () => {
  it('returns options without divider when no undefined values', () => {
    const data: Item[] = [{ status: 'active' }, { status: 'pending' }];
    const result = buildOptionsWithFallback(data, keyExtractor, 'No status');
    expect(result).toEqual([
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
    ]);
  });

  it('adds divider and synthetic option when undefined values exist', () => {
    const data: Item[] = [{ status: 'active' }, { status: undefined }, { status: null }];
    const result = buildOptionsWithFallback(data, keyExtractor, 'No status');
    expect(result).toEqual([
      { label: 'Active', value: 'active' },
      { type: 'divider' },
      { label: 'No status', value: NONE_VALUE },
    ]);
  });

  it('returns empty array for empty data', () => {
    const result = buildOptionsWithFallback([], keyExtractor, 'No status');
    expect(result).toEqual([]);
  });

  it('returns only synthetic option when ALL values are undefined', () => {
    const data: Item[] = [{ status: undefined }, { status: null }, {}];
    const result = buildOptionsWithFallback(data, keyExtractor, 'No status');
    expect(result).toEqual([{ label: 'No status', value: NONE_VALUE }]);
  });
});
