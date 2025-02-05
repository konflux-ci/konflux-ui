import { useCallback, useEffect, useMemo, useState } from 'react';
import PipelineRunsFilterToolbar from '../components/Filter/PipelineRunsFilterToolbar';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { PipelineRunKind } from '../types';
import { pipelineRunStatus } from '../utils/pipeline-utils';
import { useSearchParam } from './useSearchParam';

export const usePipelineRunsFilter = () => {
  const [nameFilter, setNameFilter, unsetNameFilter] = useSearchParam('name', '');
  const [statusFiltersParam, setStatusFiltersParam, unsetStatusFiltersParam] = useSearchParam(
    'status',
    '',
  );
  const [typeFiltersParam, setTypeFiltersParam, unsetTypeFiltersParam] = useSearchParam('type', '');
  const [onLoadName, setOnLoadName] = useState(nameFilter);
  useEffect(() => {
    if (nameFilter) {
      setOnLoadName(nameFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusFilters = useMemo(
    () => (statusFiltersParam ? statusFiltersParam.split(',') : []),
    [statusFiltersParam],
  );

  const setStatusFilters = useCallback(
    (filters: string[]) => setStatusFiltersParam(filters.join(',')),
    [setStatusFiltersParam],
  );

  const typeFilters = useMemo(
    () => (typeFiltersParam ? typeFiltersParam.split(',') : []),
    [typeFiltersParam],
  );

  const setTypeFilters = useCallback(
    (filters: string[]) => setTypeFiltersParam(filters.join(',')),
    [setTypeFiltersParam],
  );

  const filterPLRs = useCallback(
    (pipelineRuns: PipelineRunKind[]) =>
      pipelineRuns.filter((plr) => {
        const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
        return (
          (!nameFilter ||
            plr.metadata.name.indexOf(nameFilter) >= 0 ||
            plr.metadata.labels?.[PipelineRunLabel.COMPONENT]?.indexOf(
              nameFilter.trim().toLowerCase(),
            ) >= 0) &&
          (!statusFilters.length || statusFilters.includes(pipelineRunStatus(plr))) &&
          (!typeFilters.length || typeFilters.includes(runType))
        );
      }),
    [nameFilter, statusFilters, typeFilters],
  );

  const onClearFilters = useCallback(() => {
    onLoadName.length && setOnLoadName('');
    unsetNameFilter();
    unsetStatusFiltersParam();
    unsetTypeFiltersParam();
  }, [onLoadName, setOnLoadName, unsetNameFilter, unsetStatusFiltersParam, unsetTypeFiltersParam]);

  const filterToolbar = useCallback(
    (statusOptions, typeOptions) => (
      <PipelineRunsFilterToolbar
        nameFilter={nameFilter}
        setNameFilter={setNameFilter}
        statusFilters={statusFilters}
        setStatusFilters={setStatusFilters}
        typeFilters={typeFilters}
        setTypeFilters={setTypeFilters}
        onLoadName={onLoadName}
        setOnLoadName={setOnLoadName}
        statusOptions={statusOptions}
        typeOptions={typeOptions}
        onClearFilters={onClearFilters}
      />
    ),
    [
      nameFilter,
      setNameFilter,
      statusFilters,
      setStatusFilters,
      typeFilters,
      setTypeFilters,
      onLoadName,
      setOnLoadName,
      onClearFilters,
    ],
  );

  return {
    filterPLRs,
    filterState: { nameFilter, onLoadName, statusFilters, typeFilters },
    filterToolbar,
    onClearFilters,
  };
};
