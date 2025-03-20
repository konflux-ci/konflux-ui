import { createContext, useCallback, useMemo } from 'react';
import { useSearchParamBatch } from '../../../hooks/useSearchParam';
import { PipelineRunsFilterState } from './pipelineruns-filter-utils';

export type PipelineRunsFilterContextType = {
  filters: PipelineRunsFilterState;
  setFilters: (newFilters: PipelineRunsFilterState) => void;
  onClearFilters: () => void;
};

export const PipelineRunsFilterContext = createContext<PipelineRunsFilterContextType>({
  filters: { name: '', status: [], type: [] },
  setFilters: () => null,
  onClearFilters: () => null,
});

export const PipelineRunsFilterContextProvider = ({ children }) => {
  const [getValues, batchSet, batchUnset] = useSearchParamBatch(['name', 'status', 'type']);
  const { name } = getValues('name');
  const { status } = getValues('status');
  const { type } = getValues('type');

  const nameFilter = name ?? '';
  const typeFilter = useMemo(() => {
    return type ? type.split(',') : [];
  }, [type]);

  const statusFilter = useMemo(() => (status ? status.split(',') : []), [status]);

  const setFilters = useCallback(
    (newFilter: Record<string, string | string[]>) => {
      const formatedFilter = Object.fromEntries(
        Object.entries(newFilter).map(([key, value]) => {
          if (Array.isArray(value)) {
            return [key, value.join(',')];
          }

          return [key, value];
        }),
      );
      batchSet(formatedFilter);
    },
    [batchSet],
  );

  return (
    <PipelineRunsFilterContext.Provider
      value={{
        filters: { name: nameFilter, status: statusFilter, type: typeFilter },
        setFilters,
        onClearFilters: batchUnset,
      }}
    >
      {children}
    </PipelineRunsFilterContext.Provider>
  );
};
