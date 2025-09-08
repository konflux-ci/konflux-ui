import { createContext, useCallback } from 'react';
import { useSearchParamBatch } from '~/hooks/useSearchParam';
import { useDeepCompareMemoize } from '~/shared';
import { FilterType } from '../utils/filter-utils';

const safeJSONParse = (value: string) => {
  if (!value) return null;
  try {
    // first try to parse the value
    return JSON.parse(value);
  } catch (e) {
    // if JSON.parse(..) fails, then return the value as it is
    // eslint-disable-next-line no-console
    console.warn(
      "The value passed is not a valid JSON, hence it's being returned as is. Error for reference: ",
      e,
    );
    return value;
  }
};

export type FilterContextType = {
  filters: FilterType;
  setFilters: (newFilters: FilterType) => void;
  onClearFilters: () => void;
};

export const FilterContext = createContext<FilterContextType>({
  filters: {},
  setFilters: () => null,
  onClearFilters: () => null,
});

type FilterContextProviderProps = {
  filterParams: string[];
  children: React.ReactNode;
};

export const FilterContextProvider = ({ filterParams, children }: FilterContextProviderProps) => {
  const [getValues, batchSet, batchUnset] = useSearchParamBatch(filterParams);
  const filters = useDeepCompareMemoize(
    Object.fromEntries(
      Object.entries(getValues()).map(([key, value]) => {
        return [key, value ? safeJSONParse(value) : null];
      }),
    ),
  );

  const setFilters = useCallback(
    (newFilter: FilterType) => {
      const formatedFilter = Object.fromEntries(
        Object.entries(newFilter).map(([key, value]) => {
          if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            // only stringify if the value isn't already a string
            const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
            return [key, stringifiedValue];
          }
          return [key, null];
        }),
      );

      batchSet(formatedFilter);
    },
    [batchSet],
  );

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        onClearFilters: batchUnset,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};
