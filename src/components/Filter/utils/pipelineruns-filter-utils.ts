import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { textMatch } from '~/utils/text-filter-utils';

export type PipelineRunsFilterState = {
  name: string;
  status?: string[];
  type?: string[];
  version?: string;
};

export const filterPipelineRuns = (
  pipelineRuns: PipelineRunKind[],
  filters: PipelineRunsFilterState,
  customFilter?: (plr: PipelineRunKind) => boolean,
  componentName?: string,
): PipelineRunKind[] => {
  const { name, status, type, version } = filters;

  return pipelineRuns
    .filter((plr) => {
      // prefer the new component model's label; a PLR carries either model's labels
      const runType =
        plr?.metadata?.labels?.[PipelineRunLabel.V2_PIPELINE_TYPE] ??
        plr?.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE];
      return (
        textMatch(plr.metadata?.name, name) &&
        (!componentName ||
          textMatch(
            plr.metadata?.labels?.[PipelineRunLabel.V2_COMPONENT] ??
              plr.metadata?.labels?.[PipelineRunLabel.COMPONENT],
            componentName,
          )) &&
        (!status?.length || status.includes(pipelineRunStatus(plr))) &&
        (!type?.length || type.includes(runType)) &&
        (!version ||
          textMatch(
            plr?.metadata?.labels?.[PipelineRunLabel.V2_COMPONENT_VERSION] ??
              plr?.metadata?.labels?.[PipelineRunLabel.COMPONENT_VERSION] ??
              plr?.metadata?.annotations?.[PipelineRunLabel.V2_COMPONENT_VERSION],
            version,
          ))
      );
    })
    .filter((plr) => !customFilter || customFilter(plr));
};
