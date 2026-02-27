import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';

export type PipelineRunsFilterStateV2 = {
  name: string;
  status: string[];
  type: string[];
  version: string[];
};

export const filterPipelineRunsV2 = (
  pipelineRuns: PipelineRunKind[],
  filters: PipelineRunsFilterStateV2,
  componentName?: string,
): PipelineRunKind[] => {
  const { name, status, type, version } = filters;

  return pipelineRuns.filter((plr) => {
    const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
    return (
      (!name || plr.metadata.name.indexOf(name) >= 0) &&
      (!componentName ||
        plr.metadata.labels?.[PipelineRunLabel.COMPONENT]?.indexOf(
          componentName.trim().toLowerCase(),
        ) >= 0) &&
      (!status.length || status.includes(pipelineRunStatus(plr))) &&
      (!type.length || type.includes(runType)) &&
      (!version.length ||
        version.includes(plr?.metadata.labels[PipelineRunLabel.COMPONENT_VERSION]))
    );
  });
};
