import { useMemo } from 'react';
import type { FilterConfig } from '~/shared/components/Filter/types';
import { textMatch } from '~/utils/text-filter-utils';

type FilterFn<T> = (item: T) => boolean;

/** Returns `true` when the value equals its type's "empty" default. */
const isEmpty = (value: unknown): boolean => {
  if (typeof value === 'string') return value === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'boolean') return value === false;
  return true;
};

/**
 * Applies client-side filtering to a data array using the provided filter configs.
 *
 * This hook is URL-unaware — it receives pre-read `clientFilterValues` and
 * returns the filtered subset. Filters with `mode: 'api'` or `type: 'boolean'`
 * are skipped.
 *
 * For `search` configs without a custom `filterFn`, a default predicate using
 * `textMatch` on `item.metadata.name` is used.
 *
 * All active predicates are combined with AND logic — an item must pass every
 * active filter to be included.
 *
 * @typeParam T - The data-item type being filtered.
 * @param configs - Filter configuration array (same one passed to `useFilterState`).
 * @param data - The full (unfiltered) data array.
 * @param clientFilterValues - Current client-side filter values (from `useFilterState`).
 * @returns Object with `filteredData` — the filtered subset of `data`.
 *
 * @example
 * ```tsx
 * const { clientFilterValues } = useFilterState(filterConfigs);
 * const { filteredData } = useFilteredData(filterConfigs, allItems, clientFilterValues);
 * ```
 */
export const useFilteredData = <T>(
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

          if (field.multiValue) {
            // Multi-value: fieldValue is string[], match ANY value (OR logic)
            const values: string[] = Array.isArray(fieldValue) ? (fieldValue as string[]) : [];
            if (values.length > 0) {
              activeFilters.push((item) => values.some((v) => field.filterFn(item, v)));
            }
          } else {
            // Single-value: existing behavior
            if (typeof fieldValue === 'string' && !isEmpty(fieldValue)) {
              activeFilters.push((item) => field.filterFn(item, fieldValue));
            }
          }
        }
        continue;
      }

      const value = clientFilterValues[config.param];
      if (isEmpty(value)) continue;

      if (config.type === 'search') {
        const filterFn =
          config.filterFn ??
          ((item: T, v: string) =>
            textMatch((item as { metadata?: { name?: string } }).metadata?.name ?? '', v));
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
