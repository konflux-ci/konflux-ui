import { renderHook } from '@testing-library/react';
import type { FilterConfig } from '~/components/Filter';
import { useFilteredData } from '~/components/Filter/hooks/useFilteredData';
import { textMatch } from '~/utils/text-filter-utils';

type MockItem = {
  metadata: { name: string; namespace: string };
  spec: { status: string };
};

const items: MockItem[] = [
  { metadata: { name: 'alpha-app', namespace: 'default' }, spec: { status: 'running' } },
  { metadata: { name: 'beta-service', namespace: 'production' }, spec: { status: 'stopped' } },
  { metadata: { name: 'gamma-job', namespace: 'default' }, spec: { status: 'running' } },
];

describe('useFilteredData', () => {
  it('returns original array reference when no filters are active', () => {
    const configs: FilterConfig<MockItem>[] = [{ type: 'search', param: 'name', label: 'Name' }];
    const filterValues = { name: '' };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    expect(result.current.filteredData).toBe(items);
  });

  it('filters by search text', () => {
    const configs: FilterConfig<MockItem>[] = [
      {
        type: 'search',
        param: 'name',
        label: 'Name',
        filterFn: (item, value) => textMatch(item.metadata.name, value),
      },
    ];
    const filterValues = { name: 'alpha' };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    expect(result.current.filteredData).toEqual([items[0]]);
  });

  it('filters by multi-select values', () => {
    const configs: FilterConfig<MockItem>[] = [
      {
        type: 'multiSelect',
        param: 'status',
        label: 'Status',
        filterFn: (item, values) => values.includes(item.spec.status),
      },
    ];
    const filterValues = { status: ['running'] };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    expect(result.current.filteredData).toEqual([items[0], items[2]]);
  });

  it('combines multiple filters with AND logic', () => {
    const configs: FilterConfig<MockItem>[] = [
      {
        type: 'search',
        param: 'name',
        label: 'Name',
        filterFn: (item, value) => textMatch(item.metadata.name, value),
      },
      {
        type: 'multiSelect',
        param: 'status',
        label: 'Status',
        filterFn: (item, values) => values.includes(item.spec.status),
      },
    ];
    const filterValues = { name: 'a', status: ['running'] };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    // 'a' matches alpha-app and gamma-job; 'running' matches alpha-app and gamma-job
    // AND: alpha-app and gamma-job
    expect(result.current.filteredData).toEqual([items[0], items[2]]);
  });

  it('returns empty array when no items match', () => {
    const configs: FilterConfig<MockItem>[] = [
      {
        type: 'search',
        param: 'name',
        label: 'Name',
        filterFn: (item, value) => textMatch(item.metadata.name, value),
      },
    ];
    const filterValues = { name: 'nonexistent' };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    expect(result.current.filteredData).toEqual([]);
  });

  it('uses default textMatch(item.metadata.name, value) for search config without filterFn', () => {
    const configs: FilterConfig<MockItem>[] = [{ type: 'search', param: 'name', label: 'Name' }];
    const filterValues = { name: 'beta' };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    expect(result.current.filteredData).toEqual([items[1]]);
  });

  it('handles empty data array', () => {
    const configs: FilterConfig<MockItem>[] = [
      {
        type: 'search',
        param: 'name',
        label: 'Name',
        filterFn: (item, value) => textMatch(item.metadata.name, value),
      },
    ];
    const emptyData: MockItem[] = [];
    const filterValues = { name: 'alpha' };

    const { result } = renderHook(() => useFilteredData(configs, emptyData, filterValues));

    expect(result.current.filteredData).toEqual([]);
  });

  it('skips api-mode configs', () => {
    const configs: FilterConfig<MockItem>[] = [
      {
        type: 'search',
        param: 'name',
        label: 'Name',
        mode: 'api',
        filterFn: (item, value) => textMatch(item.metadata.name, value),
      },
    ];
    const filterValues = { name: 'alpha' };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    // api-mode filter is skipped, so all items returned (original reference)
    expect(result.current.filteredData).toBe(items);
  });

  it('skips boolean configs', () => {
    const configs: FilterConfig<MockItem>[] = [
      { type: 'boolean', param: 'showLatest', label: 'Show latest' },
    ];
    const filterValues = { showLatest: true };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    // boolean configs are skipped, so all items returned (original reference)
    expect(result.current.filteredData).toBe(items);
  });

  it('filters by single-select value', () => {
    const configs: FilterConfig<MockItem>[] = [
      {
        type: 'singleSelect',
        param: 'status',
        label: 'Status',
        filterFn: (item, value) => item.spec.status === value,
      },
    ];
    const filterValues = { status: 'stopped' };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    expect(result.current.filteredData).toEqual([items[1]]);
  });

  it('handles switchableSearch by applying only active fields', () => {
    const configs: FilterConfig<MockItem>[] = [
      {
        type: 'switchableSearch',
        param: 'searchField',
        label: 'Search',
        fields: [
          {
            label: 'Name',
            value: 'name',
            param: 'name',
            filterFn: (item, text) => textMatch(item.metadata.name, text),
          },
          {
            label: 'Namespace',
            value: 'namespace',
            param: 'ns',
            filterFn: (item, text) => textMatch(item.metadata.namespace, text),
          },
        ],
      },
    ];
    // Only name field has a value; namespace is empty
    const filterValues = { searchField: 'name', name: 'alpha', ns: '' };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    expect(result.current.filteredData).toEqual([items[0]]);
  });

  it('skips switchableSearch fields with api mode', () => {
    const configs: FilterConfig<MockItem>[] = [
      {
        type: 'switchableSearch',
        param: 'searchField',
        label: 'Search',
        fields: [
          {
            label: 'Name',
            value: 'name',
            param: 'name',
            mode: 'api',
            filterFn: (item, text) => textMatch(item.metadata.name, text),
          },
        ],
      },
    ];
    const filterValues = { searchField: 'name', name: 'alpha' };

    const { result } = renderHook(() => useFilteredData(configs, items, filterValues));

    // api-mode field skipped, so original reference returned
    expect(result.current.filteredData).toBe(items);
  });
});
