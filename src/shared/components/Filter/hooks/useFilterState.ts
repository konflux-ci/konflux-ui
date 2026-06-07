import { useMemo, useCallback } from 'react';
import { useQueryStates, parseAsString, parseAsJson, parseAsBoolean } from 'nuqs';
import type {
  FilterConfig,
  FilterValues,
  ClientFilterValues,
} from '~/shared/components/Filter/types';
import { parseAsCommaSeparated } from '../parsers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyParserMap = Record<string, any>;

/**
 * Builds a nuqs parser map from the filter config array.
 *
 * Each config's `param` is mapped to the appropriate nuqs parser
 * (`parseAsString`, `parseAsJson`, `parseAsBoolean`) with a sensible default.
 */
const buildParsersMap = <T>(configs: readonly FilterConfig<T>[]): AnyParserMap => {
  const map: AnyParserMap = {};

  for (const config of configs) {
    switch (config.type) {
      case 'search':
      case 'singleSelect':
        map[config.param] = parseAsString.withDefault('');
        break;
      case 'multiSelect':
        map[config.param] = parseAsJson<string[]>((v) =>
          Array.isArray(v) && v.every((i) => typeof i === 'string') ? v : [],
        ).withDefault([]);
        break;
      case 'boolean':
        map[config.param] = parseAsBoolean.withDefault(false);
        break;
      case 'switchableSearch':
        map[config.param] = parseAsString.withDefault('');
        for (const field of config.fields) {
          if (field.multiValue) {
            map[field.param] = parseAsCommaSeparated;
          } else {
            map[field.param] = parseAsString.withDefault('');
          }
        }
        break;
      default:
        break;
    }
  }

  return map;
};

/** Returns `true` when the value equals its type's "empty" default. */
const isDefault = (value: unknown): boolean => {
  if (typeof value === 'string') return value === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'boolean') return value === false;
  return true;
};

/**
 * Collects the set of URL parameter keys that participate in client-side filtering.
 *
 * Excludes `boolean` configs and any config/field with `mode: 'api'`.
 */
const buildClientFilterKeys = <T>(configs: readonly FilterConfig<T>[]): Set<string> => {
  const keys = new Set<string>();
  for (const config of configs) {
    if (config.type === 'boolean') continue;
    if (config.mode === 'api') continue;

    if (config.type === 'switchableSearch') {
      keys.add(config.param);
      for (const field of config.fields) {
        if (field.mode !== 'api') {
          keys.add(field.param);
        }
      }
    } else {
      keys.add(config.param);
    }
  }
  return keys;
};

/**
 * Reads all filter values from URL parameters declared in the config array.
 *
 * Uses nuqs for URL parameter management. Filter controls write their own
 * params; this hook reads them all and provides derived state.
 *
 * @param configs - Array of filter configurations defining which URL params to read.
 * @returns Object with `filterValues`, `clientFilterValues`, `isFiltered`, and `clearAll`.
 *
 * @example
 * ```tsx
 * const filterConfigs = defineFilters<PipelineRun>()([
 *   { type: 'search', param: 'name', label: 'Name' },
 *   { type: 'multiSelect', param: 'status', label: 'Status', filterFn: matchStatus },
 * ] as const);
 *
 * const { filterValues, clientFilterValues, isFiltered, clearAll } = useFilterState(filterConfigs);
 * ```
 */
export const useFilterState = <C extends readonly FilterConfig<unknown>[]>(
  configs: C,
): {
  /** All filter values keyed by param name, including api-mode and boolean. */
  filterValues: FilterValues<C>;
  /** Subset of values used for client-side filtering (excludes api-mode and boolean). */
  clientFilterValues: ClientFilterValues<C>;
  /** `true` when any filter has a non-default value. */
  isFiltered: boolean;
  /** Resets every filter parameter to `null`, removing them from the URL. */
  clearAll: () => void;
} => {
  const parsersMap = useMemo(() => buildParsersMap(configs), [configs]);
  const clientKeys = useMemo(() => buildClientFilterKeys(configs), [configs]);

  const [values, setValues] = useQueryStates(parsersMap);

  const filterValues = values as unknown as FilterValues<C>;

  const clientFilterValues = useMemo(() => {
    const result: Record<string, unknown> = {};
    for (const key of clientKeys) {
      if (key in values) {
        result[key] = values[key];
      }
    }
    return result as ClientFilterValues<C>;
  }, [values, clientKeys]);

  const isFiltered = useMemo(() => Object.values(values).some((v) => !isDefault(v)), [values]);

  const clearAll = useCallback(() => {
    const nullValues: Record<string, null> = {};
    for (const key of Object.keys(parsersMap)) {
      nullValues[key] = null;
    }
    void setValues(nullValues);
  }, [parsersMap, setValues]);

  return useMemo(
    () => ({ filterValues, clientFilterValues, isFiltered, clearAll }),
    [filterValues, clientFilterValues, isFiltered, clearAll],
  );
};
