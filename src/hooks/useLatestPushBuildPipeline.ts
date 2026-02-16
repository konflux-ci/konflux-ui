import * as React from 'react';
import {
  PipelineRunEventType,
  PipelineRunLabel,
  PipelineRunType,
  runStatus,
} from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { usePipelineRunsV2 } from './usePipelineRunsV2';

export const useLatestBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
): [PipelineRunKind, boolean, unknown] => {
  const result = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
          },
        },
        limit: 1,
      }),
      [componentName],
    ),
  ) as unknown as [PipelineRunKind[], boolean, unknown];

  return React.useMemo(() => [result[0]?.[0], result[1], result[2]], [result]);
};

export const useLatestSuccessfulBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
  branchName?: string,
): [PipelineRunKind | undefined, boolean, unknown] => {
  const [pipelines, loaded, error, getNextPage] = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
          },
          ...(branchName ? { filterByTargetBranch: branchName } : {}),
        },
      }),
      [componentName, branchName],
    ),
  );

  const latestSuccess = React.useMemo(
    () =>
      loaded &&
      !error &&
      pipelines?.find((pipeline) => pipelineRunStatus(pipeline) === runStatus.Succeeded),
    [error, loaded, pipelines],
  );

  React.useEffect(() => {
    if (loaded && !error && !latestSuccess && getNextPage) {
      getNextPage();
    }
  }, [loaded, error, getNextPage, latestSuccess]);

  return [latestSuccess, loaded, error];
};

export const useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2 = (
  namespace: string,
  componentName: string,
  branchName: string | undefined,
): [PipelineRunKind | undefined, boolean, unknown] =>
  useLatestSuccessfulBuildPipelineRunForComponentV2(namespace, componentName, branchName);

export const useLatestPushBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
): [PipelineRunKind, boolean, unknown] => {
  const result = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
          },
        },
        limit: 1,
      }),
      [componentName],
    ),
  );

  return [result[0]?.[0], result[1], result[2]];
};
