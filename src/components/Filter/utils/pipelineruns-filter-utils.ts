import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';

export type PipelineRunsFilterState = {
  name: string;
  status: string[];
  type: string[];
};

export const filterPipelineRuns = (
  pipelineRuns: PipelineRunKind[],
  filters: PipelineRunsFilterState,
  customFilter?: (plr: PipelineRunKind) => boolean,
): PipelineRunKind[] => {
  const { name, status, type } = filters;

  return pipelineRuns
    .filter((plr) => {
      const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
      return (
        (!name ||
          plr.metadata.name.indexOf(name) >= 0 ||
          plr.metadata.labels?.[PipelineRunLabel.COMPONENT]?.indexOf(name.trim().toLowerCase()) >=
            0) &&
        (!status.length || status.includes(pipelineRunStatus(plr))) &&
        (!type.length || type.includes(runType))
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
