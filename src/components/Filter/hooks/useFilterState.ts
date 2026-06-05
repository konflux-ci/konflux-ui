import { useMemo, useCallback } from 'react';
import { useQueryStates, parseAsString, parseAsJson, parseAsBoolean } from 'nuqs';
import type { FilterConfig, FilterValues, ClientFilterValues } from '~/components/Filter/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyParserMap = Record<string, any>;

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
          map[field.param] = parseAsString.withDefault('');
        }
        break;
      default:
        break;
    }
  }

  return map;
};

const isDefault = (value: unknown): boolean => {
  if (typeof value === 'string') return value === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'boolean') return value === false;
  return true;
};

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

export const useFilterState = <C extends readonly FilterConfig<unknown>[]>(
  configs: C,
): {
  filterValues: FilterValues<C>;
  clientFilterValues: ClientFilterValues<C>;
  isFiltered: boolean;
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
