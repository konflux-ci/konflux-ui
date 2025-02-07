import React from 'react';
import { useSearchParams } from 'react-router-dom';

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

export const useSearchParamBatch = (): [
  (names?: string[]) => Record<string, string>,
  (newValues: Record<string, string>) => void,
  (names?: string[]) => void,
] => {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = React.useCallback(
    (names?: string[]) => {
      const result: Record<string, string> = {};

      searchParams.forEach((value, name) => {
        if (!names || names.includes(name)) {
          result[name] = value;
        }
      });

      return result;
    },
    [searchParams],
  );

  const batchSet = React.useCallback(
    (newValues: Record<string, string>) => {
      const newSearchParams = new URLSearchParams(searchParams);
      Object.entries(newValues).forEach(([name, newValue]) => {
        if (newSearchParams.get(name) !== newValue) {
          newSearchParams.set(name, newValue);
        }
      });
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams],
  );

  const batchUnset = React.useCallback(
    (names?: string[]) => {
      const newSearchParams = new URLSearchParams(searchParams);
      searchParams.forEach((_, name) => {
        if (!names || names.includes(name)) {
          newSearchParams.delete(name);
        }
      });
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams],
  );

  return [values, batchSet, batchUnset];
};
