import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { PipelineRunKind } from '../../../types';
import { getCommitSha } from '../../../utils/commits-utils';
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
  componentName?: string,
): PipelineRunKind[] => {
  const { name, commit, status, type } = filters;

  return pipelineRuns
    .filter((plr) => {
      const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];

      // Handle name or commit filtering
      let searchMatch = true;
      if (commit && commit.trim().length > 0) {
        // Filter by commit SHA (starts with match)
        const commitSha = getCommitSha(plr);
        if (commitSha && typeof commitSha === 'string' && commitSha.trim().length > 0) {
          const shaNormalized = commitSha.trim().toLowerCase();
          const searchTerm = commit.trim().toLowerCase();
          searchMatch = shaNormalized.startsWith(searchTerm);
        } else {
          // No valid commit SHA found, exclude this pipeline run
          searchMatch = false;
        }
      } else if (name && name.trim().length > 0) {
        // Filter by name (contains match)
        searchMatch = plr.metadata.name.indexOf(name) >= 0;
      }

      return (
        searchMatch &&
        (!componentName ||
          plr.metadata.labels?.[PipelineRunLabel.COMPONENT]?.indexOf(
            componentName.trim().toLowerCase(),
          ) >= 0) &&
        (!status.length || status.includes(pipelineRunStatus(plr))) &&
        (!type.length || type.includes(runType))
      );
    })
    .filter((plr) => !customFilter || customFilter(plr));
};
