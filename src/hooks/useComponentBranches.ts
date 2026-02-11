import * as React from 'react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunsV2 } from './usePipelineRunsV2';

/**
 * Returns distinct branch names (target_branch annotation) from pipeline runs
 * for the given component. Used to populate the Versions tab.
 * Note: Uses a limit of 100 pipeline runs; branches whose runs fall outside
 * the first 100 (by creation time) will not appear in the list.
 */
export const useComponentBranches = (
  namespace: string | null,
  componentName: string | undefined,
): [string[], boolean, unknown] => {
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
              limit: 100,
            }
          : undefined,
      [componentName],
    ),
  );

  const branches = React.useMemo(() => {
    if (!loaded || !pipelineRuns) return [];
    const set = new Set<string>();
    pipelineRuns.forEach((plr) => {
      const branch = plr.metadata?.annotations?.[PipelineRunLabel.COMMIT_BRANCH_ANNOTATION];
      if (branch) {
        set.add(branch);
      }
    });
    return Array.from(set).sort();
  }, [loaded, pipelineRuns]);

  return [branches, loaded, error];
};
