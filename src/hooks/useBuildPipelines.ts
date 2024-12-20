import * as React from 'react';
import { useWorkspaceInfo } from '../components/Workspace/useWorkspaceInfo';
import { PipelineRunLabel, PipelineRunType } from '../consts/pipelinerun';
import { PipelineRunGroupVersionKind } from '../models';
import { PipelineRunKind } from '../types';
import { usePipelineRuns } from './usePipelineRuns';
import { GetNextPage } from './useTektonResults';

export const useBuildPipelines = (
  namespace: string,
  applicationName: string,
  commit?: string,
  includeComponents?: boolean,
  componentNames?: string[],
  limit?: number,
): [PipelineRunKind[], boolean, unknown, GetNextPage] => {
  const { workspace } = useWorkspaceInfo();
  const [pipelineRuns, loaded, plrError, getNextPage] = usePipelineRuns(
    includeComponents && !componentNames?.length ? null : namespace,
    workspace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.APPLICATION]: applicationName,
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
          },
          ...(includeComponents &&
            componentNames?.length > 0 && {
              matchExpressions: [
                {
                  key: PipelineRunLabel.COMPONENT,
                  operator: 'In',
                  values: componentNames,
                },
              ],
            }),
          filterByCommit: commit ? commit : undefined,
        },
        // TODO: Add limit when filtering by component name AND only PLRs are returned: https://github.com/tektoncd/results/issues/620
        // limit,
      }),
      [applicationName, includeComponents, componentNames, commit],
    ),
  );

  // TODO: Remove this if/when tekton results are really filtered by component names above: https://github.com/tektoncd/results/issues/620
  return React.useMemo(() => {
    if (!loaded || plrError) {
      return [[], loaded, plrError, getNextPage];
    }

    // when filtering by commit, both PipelineRun and TaskRun objects are returned: https://github.com/tektoncd/results/issues/620
    const runs = pipelineRuns.filter((plr) => plr.kind === PipelineRunGroupVersionKind.kind);

    if (!includeComponents || !componentNames?.length) {
      return [runs.slice(0, limit ? limit : undefined), loaded, plrError, getNextPage];
    }
    return [
      runs
        .filter((plr) =>
          componentNames.includes(plr.metadata?.labels?.[PipelineRunLabel.COMPONENT]),
        )
        .slice(0, limit ? limit : undefined),
      true,
      undefined,
      getNextPage,
    ];
  }, [loaded, plrError, includeComponents, componentNames, pipelineRuns, limit, getNextPage]);
};
