import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';

export type PipelineRunsFilterState = {
  name: string;
  commit: string;
  status: string[];
  type: string[];
};

export const filterPipelineRuns = (
  pipelineRuns: PipelineRunKind[],
  filters: PipelineRunsFilterState,
  customFilter?: (plr: PipelineRunKind) => boolean,
): PipelineRunKind[] => {
  const { name, commit, status, type } = filters;

  return pipelineRuns
    .filter((plr) => {
      const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
      const commitSha =
        plr?.metadata.labels?.[PipelineRunLabel.COMMIT_LABEL] ||
        plr?.metadata.labels?.[PipelineRunLabel.TEST_SERVICE_COMMIT] ||
        plr?.metadata.annotations?.[PipelineRunLabel.COMMIT_ANNOTATION];

      return (
        (!name ||
          plr.metadata.name.toLowerCase().includes(name.toString().trim().toLowerCase()) ||
          plr.metadata.labels?.[PipelineRunLabel.COMPONENT]
            ?.toLowerCase()
            .includes(name.toString().trim().toLowerCase())) &&
        (!commit ||
          !commit.toString().trim() ||
          (commitSha &&
            commitSha.toLowerCase().startsWith(commit.toString().trim().toLowerCase()))) &&
        (!status.length || status.includes(pipelineRunStatus(plr))) &&
        (!type.length || type.includes(runType))
      );
    })
    .filter((plr) => !customFilter || customFilter(plr));
};
