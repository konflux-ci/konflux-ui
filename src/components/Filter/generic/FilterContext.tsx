import { createContext, useCallback } from 'react';
import { useSearchParamBatch } from '~/hooks/useSearchParam';
import { useDeepCompareMemoize } from '~/shared';
import { FilterType } from '../utils/filter-utils';

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
      Object.entries(getValues()).map(([key, value]) => [key, value ? JSON.parse(value) : null]),
    ),
  );

  const setFilters = useCallback(
    (newFilter: FilterType) => {
      const formatedFilter = Object.fromEntries(
        Object.entries(newFilter).map(([key, value]) => {
          if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            return [key, JSON.stringify(value)];
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
