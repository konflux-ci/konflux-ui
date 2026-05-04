import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';

export type FilterType = Record<string, string | string[] | boolean>;

export const filterPipelineRuns = (
  pipelineRuns: PipelineRunKind[],
  filters: FilterType,
  customFilter?: (plr: PipelineRunKind) => boolean,
): PipelineRunKind[] => {
  const { name, status, type } = filters;

  // It is not possible for `name` to not be a string, or `status` and `type` to not be arrays
  if (typeof name !== 'string' || !Array.isArray(status) || !Array.isArray(type)) {
    throw new Error('Invalid filter');
  }

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
