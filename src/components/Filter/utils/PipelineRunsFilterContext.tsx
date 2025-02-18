import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParamBatch } from '../../../hooks/useSearchParam';

export type PipelineRunsFilterContextType = {
  nameFilter: string;
  setNameFilter: (name: string) => void;
  statusFilter: string[];
  setStatusFilter: (filters: string[]) => void;
  typeFilter: string[];
  setTypeFilter: (filters: string[]) => void;
  clearAllFilters: () => void;
};

export const PipelineRunsFilterContext = createContext<PipelineRunsFilterContextType>({
  nameFilter: '',
  setNameFilter: () => {},
  statusFilter: [],
  setStatusFilter: () => {},
  typeFilter: [],
  setTypeFilter: () => {},
  clearAllFilters: () => {},
});

export const PipelineRunsFilterContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [getValues, batchSet, batchUnset] = useSearchParamBatch(['name', 'status', 'type']);
  const [nameFilterString, setNameFilterString] = useState('');
  const [statusFilterString, setStatusFilterString] = useState<string>('');
  const [typeFilterString, setTypeFilterString] = useState<string>('');

  const setNameFilter = useCallback(
    (name: string) => {
      batchSet({ name });
    },
    [batchSet],
  );

  const statusFilter = useMemo(
    () => (statusFilterString ? statusFilterString.split(',') : []),
    [statusFilterString],
  );

  const setStatusFilter = useCallback(
    (filters: string[]) => {
      batchSet({ status: filters.join(',') });
    },
    [batchSet],
  );

  const typeFilter = useMemo(
    () => (typeFilterString ? typeFilterString.split(',') : []),
    [typeFilterString],
  );

  const setTypeFilter = useCallback(
    (filters: string[]) => {
      batchSet({ type: filters.join(',') });
    },
    [batchSet],
  );

  useEffect(() => {
    const values = getValues();
    setNameFilterString(values.name || '');
    setStatusFilterString(values.status || '');
    setTypeFilterString(values.type || '');
  }, [getValues]);

  const clearAllFilters = () => {
    batchUnset(['name', 'status', 'type']);
  };

  return (
    <PipelineRunsFilterContext.Provider
      value={{
        nameFilter: nameFilterString,
        setNameFilter,
        statusFilter,
        setStatusFilter,
        typeFilter,
        setTypeFilter,
        clearAllFilters,
      }}
    >
      {children}
    </PipelineRunsFilterContext.Provider>
  );
};
