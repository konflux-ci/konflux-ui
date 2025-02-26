import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';

export type PipelineRunsFilterState = {
  nameFilter?: string;
  statusFilter?: string[];
  typeFilter?: string[];
};

export type PipelineRunsFilterAction = {
  type: 'SET_NAME' | 'SET_STATUS' | 'SET_TYPE' | 'CLEAR_ALL_FILTERS';
  payload?: string | string[];
};

export const filterPipelineRuns = (
  pipelineRuns: PipelineRunKind[],
  filters: PipelineRunsFilterState,
  customFilter?: (plr: PipelineRunKind) => boolean,
): PipelineRunKind[] => {
  const { nameFilter, statusFilter, typeFilter } = filters;

  return pipelineRuns
    .filter((plr) => {
      const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
      return (
        (!nameFilter ||
          plr.metadata.name.indexOf(nameFilter) >= 0 ||
          plr.metadata.labels?.[PipelineRunLabel.COMPONENT]?.indexOf(
            nameFilter.trim().toLowerCase(),
          ) >= 0) &&
        (!statusFilter.length || statusFilter.includes(pipelineRunStatus(plr))) &&
        (!typeFilter.length || typeFilter.includes(runType))
      );
    })
    .filter((plr) => !customFilter || customFilter(plr));
};

export const createFilterObj = (
  items: PipelineRunKind[],
  keyExtractor: (item: PipelineRunKind) => string | undefined,
  validKeys: string[],
  filterFn?: (item: PipelineRunKind) => boolean,
): { [key: string]: number } => {
  return items.reduce((acc, item) => {
    if (filterFn && !filterFn(item)) {
      return acc;
    }

    const key = keyExtractor(item);

    if (validKeys.includes(key)) {
      if (acc[key] !== undefined) {
        acc[key] = acc[key] + 1;
      } else {
        acc[key] = 1;
      }
    }

    return acc;
  }, {});
};
