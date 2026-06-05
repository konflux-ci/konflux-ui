import { defineFilters } from '~/components/Filter';

type MockItem = {
  metadata: { name: string; namespace: string };
  spec: { status: string };
};

describe('defineFilters', () => {
  it('returns the config array unchanged', () => {
    const configs = defineFilters<MockItem>()([{ type: 'search', param: 'name', label: 'Name' }]);
    expect(configs).toHaveLength(1);
    expect(configs[0].type).toBe('search');
    expect(configs[0].param).toBe('name');
  });

  it('preserves all config properties', () => {
    const filterFn = (item: MockItem, values: string[]) => values.includes(item.spec.status);
    const configs = defineFilters<MockItem>()([
      { type: 'multiSelect', param: 'status', label: 'Status', filterFn },
    ]);
    expect(configs[0].type).toBe('multiSelect');
    expect(configs[0]).toHaveProperty('filterFn', filterFn);
  });

  it('handles mixed config types', () => {
    const configs = defineFilters<MockItem>()([
      { type: 'search', param: 'name', label: 'Name' },
      {
        type: 'multiSelect',
        param: 'status',
        label: 'Status',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterFn: (_item, _values) => true,
      },
      { type: 'boolean', param: 'showLatest', label: 'Show latest' },
    ]);
    expect(configs).toHaveLength(3);
    expect(configs[0].type).toBe('search');
    expect(configs[1].type).toBe('multiSelect');
    expect(configs[2].type).toBe('boolean');
  });

  it('supports mode property', () => {
    const configs = defineFilters<MockItem>()([
      { type: 'search', param: 'name', label: 'Name', mode: 'api' },
    ]);
    expect(configs[0].mode).toBe('api');
  });

  it('supports switchableSearch config', () => {
    const configs = defineFilters<MockItem>()([
      {
        type: 'switchableSearch',
        param: 'searchField',
        label: 'Search',
        fields: [
          {
            label: 'Name',
            value: 'name',
            param: 'name',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            filterFn: (_item, _text) => true,
          },
          {
            label: 'Namespace',
            value: 'namespace',
            param: 'namespace',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            filterFn: (_item, _text) => true,
          },
        ],
      },
    ]);
    expect(configs[0].type).toBe('switchableSearch');
    if (configs[0].type === 'switchableSearch') {
      expect(configs[0].fields).toHaveLength(2);
    }
  });
});
