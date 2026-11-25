import { PipelineRunKind } from '~/types';
import {
  APPLICATION_PIPELINE_RUN_LABELS,
  getPipelineRunLabel,
  PipelineRunLabelConfig,
} from '~/utils/pipeline-run-labels';
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
  labels: PipelineRunLabelConfig = APPLICATION_PIPELINE_RUN_LABELS,
): PipelineRunKind[] => {
  const { name, status, type, version } = filters;

  return pipelineRuns
    .filter((plr) => {
      const runType = getPipelineRunLabel(plr, 'pipelineType', labels);
      return (
        textMatch(plr.metadata.name, name) &&
        (!componentName ||
          textMatch(getPipelineRunLabel(plr, 'component', labels), componentName)) &&
        (!status?.length || status.includes(pipelineRunStatus(plr))) &&
        (!type?.length || type.includes(runType)) &&
        (!version || textMatch(getPipelineRunLabel(plr, 'componentVersion', labels), version))
      );
    })
    .filter((plr) => !customFilter || customFilter(plr));
};
