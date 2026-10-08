import * as React from 'react';
import {
  PUSH_BUILD_EVENT_TYPES,
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
  version?: string,
): [PipelineRunKind, boolean, unknown] => {
  const result = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
            ...(version && { [PipelineRunLabel.COMPONENT_VERSION]: version }),
          },
        },
        limit: 1,
      }),
      [componentName, version],
    ),
  ) as unknown as [PipelineRunKind[], boolean, unknown];

  return React.useMemo(() => [result[0]?.[0], result[1], result[2]], [result]);
};

export const useLatestSuccessfulBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
  version?: string,
): [PipelineRunKind, boolean, unknown] => {
  const [pipelines, loaded, error, getNextPage] = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
            ...(version && { [PipelineRunLabel.COMPONENT_VERSION]: version }),
          },
        },
      }),
      [componentName, version],
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

export const useLatestPushBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
  version?: string,
): [PipelineRunKind, boolean, unknown] => {
  const result = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
            ...(version && { [PipelineRunLabel.COMPONENT_VERSION]: version }),
          },
          matchExpressions: [
            {
              key: PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL,
              operator: 'In',
              values: PUSH_BUILD_EVENT_TYPES,
            },
          ],
        },
        limit: 1,
      }),
      [componentName, version],
    ),
  );

  return [result[0]?.[0], result[1], result[2]];
};
