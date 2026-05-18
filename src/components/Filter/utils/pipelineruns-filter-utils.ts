import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';

export type PipelineRunsFilterState = {
  name: string;
  status: string[];
  type: string[];
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
      const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
      return (
        (!name || plr.metadata.name.indexOf(name) >= 0) &&
        (!componentName ||
          plr.metadata.labels?.[PipelineRunLabel.COMPONENT]
            ?.toLowerCase()
            .indexOf(componentName.trim().toLowerCase()) >= 0) &&
        (!status.length || status.includes(pipelineRunStatus(plr))) &&
        (!type.length || type.includes(runType)) &&
        (!version ||
          plr?.metadata.labels[PipelineRunLabel.COMPONENT_VERSION]
            ?.toLowerCase()
            .indexOf(version.toLowerCase()) >= 0)
      );
    })
    .filter((plr) => !customFilter || customFilter(plr));
};
