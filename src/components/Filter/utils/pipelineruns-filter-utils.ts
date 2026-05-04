import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { textMatch } from '~/utils/text-filter-utils';

export type PipelineRunsFilterState = {
  name: string;
  status: string[];
  type: string[];
  version?: string[];
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
        textMatch(plr.metadata.name, name) &&
        (!componentName ||
          textMatch(plr.metadata.labels?.[PipelineRunLabel.COMPONENT], componentName)) &&
        (!status.length || status.includes(pipelineRunStatus(plr))) &&
        (!type.length || type.includes(runType)) &&
        (!version?.length ||
          version.includes(plr?.metadata.labels[PipelineRunLabel.COMPONENT_VERSION]))
      );
    })
    .filter((plr) => !customFilter || customFilter(plr));
};
