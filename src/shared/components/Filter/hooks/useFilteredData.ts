import { useMemo } from 'react';
import type { FilterConfig } from '~/shared/components/Filter/types';
import { textMatch } from '~/utils/text-filter-utils';

type FilterFn<T> = (item: T) => boolean;

const isEmpty = (value: unknown): boolean => {
  if (typeof value === 'string') return value === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'boolean') return value === false;
  return true;
};

export const useFilteredData = <T extends { metadata: { name: string } }>(
  configs: readonly FilterConfig<T>[],
  data: T[],
  clientFilterValues: Record<string, unknown>,
): { filteredData: T[] } => {
  const filteredData = useMemo(() => {
    const activeFilters: FilterFn<T>[] = [];

    for (const config of configs) {
      // Skip boolean configs
      if (config.type === 'boolean') continue;

      // Skip api-mode configs
      if (config.mode === 'api') continue;

      if (config.type === 'switchableSearch') {
        for (const field of config.fields) {
          // Skip api-mode fields
          if (field.mode === 'api') continue;

          const fieldValue = clientFilterValues[field.param];
          if (typeof fieldValue === 'string' && !isEmpty(fieldValue)) {
            activeFilters.push((item) => field.filterFn(item, fieldValue));
          }
        }
        continue;
      }

      const value = clientFilterValues[config.param];
      if (isEmpty(value)) continue;

      if (config.type === 'search') {
        const filterFn =
          config.filterFn ?? ((item: T, v: string) => textMatch(item.metadata.name, v));
        activeFilters.push((item) => filterFn(item, value as string));
      } else if (config.type === 'multiSelect') {
        activeFilters.push((item) => config.filterFn(item, value as string[]));
      } else if (config.type === 'singleSelect') {
        activeFilters.push((item) => config.filterFn(item, value as string));
      }
    }

    if (activeFilters.length === 0) return data;

    return data.filter((item) => activeFilters.every((fn) => fn(item)));
  }, [configs, data, clientFilterValues]);

  return { filteredData };
};
