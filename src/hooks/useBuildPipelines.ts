import * as React from 'react';
import { PipelineRunLabel, PipelineRunType } from '../consts/pipelinerun';
import { PipelineRunGroupVersionKind } from '../models';
import { PipelineRunKind } from '../types';
import { useApplication } from './useApplications';
import { usePipelineRuns } from './usePipelineRuns';
import { GetNextPage, NextPageProps } from './useTektonResults';

export const useBuildPipelines = (
  namespace: string,
  applicationName: string,
  commit?: string,
  includeComponents?: boolean,
  componentNames?: string[],
  limit?: number,
): [PipelineRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const [application, applicationLoaded] = useApplication(namespace, applicationName);
  const [pipelineRuns, loaded, plrError, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRuns(
      !applicationLoaded && includeComponents && !componentNames?.length ? null : namespace,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
              [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            },
            filterByCommit: commit ? commit : undefined,
          },
          // TODO: Add limit when filtering by component name AND only PLRs are returned: https://github.com/tektoncd/results/issues/620
          // limit,
        }),
        [applicationName, commit, application],
      ),
    );

  // TODO: Remove this if/when tekton results are really filtered by component names above: https://github.com/tektoncd/results/issues/620
  return React.useMemo(() => {
    if (!loaded || plrError) {
      return [[], loaded, plrError, getNextPage, { isFetchingNextPage, hasNextPage }];
    }

    // when filtering by commit, both PipelineRun and TaskRun objects are returned: https://github.com/tektoncd/results/issues/620
    const runs = pipelineRuns.filter((plr) => plr.kind === PipelineRunGroupVersionKind.kind);

    if (!includeComponents || !componentNames?.length) {
      return [
        runs.slice(0, limit ? limit : undefined),
        loaded,
        plrError,
        getNextPage,
        { isFetchingNextPage, hasNextPage },
      ];
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
      { isFetchingNextPage, hasNextPage },
    ];
  }, [
    loaded,
    plrError,
    pipelineRuns,
    includeComponents,
    componentNames,
    limit,
    getNextPage,
    isFetchingNextPage,
    hasNextPage,
  ]);
};
