import { createContext, Dispatch, useEffect, useReducer } from 'react';
import { useSearchParamBatch } from '../../../hooks/useSearchParam';
import { PipelineRunsFilterAction, PipelineRunsFilterState } from './pipelineruns-filter-utils';

export type PipelineRunsFilterContextType = {
  filters: PipelineRunsFilterState;
  dispatchFilters: Dispatch<PipelineRunsFilterAction>;
};

export const PipelineRunsFilterContext = createContext<PipelineRunsFilterContextType>({
  filters: { nameFilter: '', statusFilter: [], typeFilter: [] },
  dispatchFilters: () => null,
});

export const PipelineRunsFilterContextProvider = ({ children }) => {
  const [getValues, batchSet, batchUnset] = useSearchParamBatch(['name', 'status', 'type']);

  const reducer = (
    state: PipelineRunsFilterState,
    action: PipelineRunsFilterAction,
  ): PipelineRunsFilterState => {
    let [type, payload] = [action.type, action.payload];
    if (payload === undefined) {
      payload = '';
    }

    switch (type) {
      case 'SET_NAME':
        batchSet({ name: payload as string });

        return { ...state, nameFilter: payload as string };
      case 'SET_STATUS':
        if (typeof payload === 'string') {
          payload = [payload];
        }

        batchSet({ status: payload.join(',') });

        return { ...state, statusFilter: payload };
      case 'SET_TYPE':
        if (typeof payload === 'string') {
          payload = [payload];
        }

        batchSet({ type: payload.join(',') });

        return { ...state, typeFilter: payload };
      case 'CLEAR_ALL_FILTERS':
        batchUnset(['name', 'status', 'type']);

        return { nameFilter: '', statusFilter: [], typeFilter: [] };
      default:
        return state;
    }
  };

  const [filters, dispatchFilters] = useReducer(reducer, {
    nameFilter: '',
    statusFilter: [],
    typeFilter: [],
  });

  useEffect(() => {
    const values = getValues();

    dispatchFilters({ type: 'SET_NAME', payload: values.name || '' });
    dispatchFilters({ type: 'SET_STATUS', payload: values.status ? values.status.split(',') : [] });
    dispatchFilters({ type: 'SET_TYPE', payload: values.type ? values.type.split(',') : [] });
  }, [getValues]);

  return (
    <PipelineRunsFilterContext.Provider
      value={{
        filters,
        dispatchFilters,
      }}
    >
      {children}
    </PipelineRunsFilterContext.Provider>
  );
};
