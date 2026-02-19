import * as React from 'react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunsV2 } from './usePipelineRunsV2';

export type ComponentVersionRow = {
  name: string;
  description: string;
  pipelineName?: string;
  pipelineRunName?: string;
};

/** Max pipeline runs to fetch when deriving component versions (branches). Branches beyond this are omitted. */
const PIPELINE_RUNS_LIMIT = 500;

/**
 * Returns a list of component versions (branches) with pipeline info for the Versions tab table.
 * Each version has name, description (empty for now), pipeline name and optional pipeline run name
 * from the latest pipeline run per branch.
 */
export const useComponentVersions = (
  namespace: string | null,
  componentName: string | undefined,
): [ComponentVersionRow[], boolean, unknown] => {
  const [pipelineRuns, loaded, error] = usePipelineRunsV2(
    namespace && componentName ? namespace : null,
    React.useMemo(
      () =>
        componentName
          ? {
              selector: {
                matchLabels: {
                  [PipelineRunLabel.COMPONENT]: componentName,
                },
              },
              limit: PIPELINE_RUNS_LIMIT,
            }
          : undefined,
      [componentName],
    ),
  );

  const versions = React.useMemo((): ComponentVersionRow[] => {
    if (!loaded || !pipelineRuns?.length) return [];

    const byBranch = new Map<string, typeof pipelineRuns>();
    pipelineRuns.forEach((plr) => {
      const branch = plr.metadata?.annotations?.[PipelineRunLabel.COMMIT_BRANCH_ANNOTATION] ?? '';
      if (!branch) return;
      const list = byBranch.get(branch) ?? [];
      list.push(plr);
      byBranch.set(branch, list);
    });

    const rows = Array.from(byBranch.entries()).map(([branch, runs]) => {
      const sorted = [...runs].sort((a, b) => {
        const aTime = a.status?.startTime ?? a.metadata?.creationTimestamp ?? '';
        const bTime = b.status?.startTime ?? b.metadata?.creationTimestamp ?? '';
        return bTime.localeCompare(aTime);
      });
      const latest = sorted[0];
      return {
        name: branch,
        description: '',
        pipelineName: latest?.spec?.pipelineRef?.name,
        pipelineRunName: latest?.metadata?.name,
      };
    });
    return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [loaded, pipelineRuns]);

  return [versions, loaded, error];
};
