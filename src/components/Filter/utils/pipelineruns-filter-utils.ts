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
