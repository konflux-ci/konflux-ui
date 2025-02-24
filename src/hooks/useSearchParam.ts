import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDeepCompareMemoize } from '../shared';

/**
 * Manage search param state reactively with react-router.
 *
 * Options:
 *  - `unsetWhenDefaultValue`: if `true` the search param will be removed if the set value is equal the default value
 */
export const useSearchParam = (
  name: string,
  defaultValue: string = null,
  options?: {
    replace?: boolean;
    unsetWhenDefaultValue?: boolean;
  },
): [string, (newValue: string) => void, () => void] => {
  const defaultValueRef = React.useRef(defaultValue);
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.has(name) ? searchParams.get(name) : defaultValueRef.current;
  const unsetWhenDefaultValue = options?.unsetWhenDefaultValue ?? true;
  const replace = options?.replace ?? true;
  const set = React.useCallback(
    (newValue: string) => {
      const newSearchParams = new URLSearchParams(window.location.search);
      if (newSearchParams.get(name) !== newValue) {
        if (unsetWhenDefaultValue && newValue === defaultValueRef.current) {
          newSearchParams.delete(name);
        } else {
          newSearchParams.set(name, newValue);
        }
        setSearchParams(newSearchParams, { replace });
      }
    },
    [name, setSearchParams, unsetWhenDefaultValue, replace],
  );

  const unset = React.useCallback(() => {
    const newSearchParams = new URLSearchParams(window.location.search);
    if (newSearchParams.has(name)) {
      newSearchParams.delete(name);
      setSearchParams(newSearchParams);
    }
  }, [name, setSearchParams]);

  return [value, set, unset];
};

/**
 * Manage multiple search params reactively with react-router. Use when you need to edit multiple search params at the same time.
 *
 * names: array of search params that are managed by the hook
 */
export const useSearchParamBatch = (
  names: string[],
): [
  (params?: string | string[]) => Record<string, string>,
  (newValues: Record<string, string>) => void,
  (params?: string | string[]) => void,
] => {
  const managedParams = useDeepCompareMemoize(names);
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Returns the values of given search params. If no search params are given, returns all managed search params.
   *
   * params: string or array of strings of search param names
   */
  const values = React.useCallback(
    (params?: string | string[]) => {
      const result: Record<string, string> = {};
      if (params === undefined) {
        managedParams.forEach((param) => {
          result[param] = searchParams.get(param);
        });

        return result;
      }

      if (typeof params === 'string') {
        if (managedParams.includes(params)) {
          return { [params]: searchParams.get(params) };
        }

        return {};
      }

      params.forEach((param) => {
        if (managedParams.includes(param)) {
          result[param] = searchParams.get(param);
        }
      });

      return result;
    },
    [searchParams, managedParams],
  );

  /**
   * Set multiple search params at once. Only sets the search params that are managed by the hook.
   *
   * newValues: object with search params and the new value
   */
  const batchSet = React.useCallback(
    (newValues: Record<string, string>) => {
      const newSearchParams = new URLSearchParams(searchParams);
      Object.entries(newValues).forEach(([name, newValue]) => {
        if (managedParams.includes(name) && newSearchParams.get(name) !== newValue) {
          // Unset the search param if the new value is empty
          if (!newValue) {
            newSearchParams.delete(name);
          } else {
            newSearchParams.set(name, newValue);
          }
        }
      });

      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams, managedParams],
  );

  /**
   * Unset multiple search params at once. If no search params are given, unsets all managed search params.
   *
   * params: string or array of strings of search param names
   */
  const batchUnset = React.useCallback(
    (params?: string | string[]) => {
      const newSearchParams = new URLSearchParams(searchParams);
      if (params === undefined) {
        managedParams.forEach((name) => {
          newSearchParams.delete(name);
        });
      } else {
        if (typeof params === 'string') {
          params = [params];
        }

        params.forEach((name) => {
          if (managedParams.includes(name)) {
            newSearchParams.delete(name);
          }
        });
      }

      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams, managedParams],
  );

  return [values, batchSet, batchUnset];
};
