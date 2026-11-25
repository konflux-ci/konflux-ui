import * as React from 'react';
import { PUSH_BUILD_EVENT_TYPES, PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import {
  APPLICATION_PIPELINE_RUN_LABELS,
  PipelineRunLabelConfig,
  getPipelineRunSelector,
  matchesPipelineRunVersion,
} from '~/utils/pipeline-run-labels';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { usePipelineRunsV2 } from './usePipelineRunsV2';

export const useLatestBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
  version?: string,
  labels: PipelineRunLabelConfig = APPLICATION_PIPELINE_RUN_LABELS,
): [PipelineRunKind, boolean, unknown] => {
  const result = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: getPipelineRunSelector(componentName, labels, version),
        },
        ...(version && !labels.versionSelector ? {} : { limit: 1 }),
      }),
      [componentName, labels, version],
    ),
  ) as unknown as [PipelineRunKind[], boolean, unknown];

  return React.useMemo(
    () => [
      result[0]?.find((pipeline) => matchesPipelineRunVersion(pipeline, version, labels)),
      result[1],
      result[2],
    ],
    [result, labels, version],
  );
};

export const useLatestSuccessfulBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
  version?: string,
  labels: PipelineRunLabelConfig = APPLICATION_PIPELINE_RUN_LABELS,
): [PipelineRunKind, boolean, unknown] => {
  const [pipelines, loaded, error, getNextPage, nextPageProps] = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: getPipelineRunSelector(componentName, labels, version),
        },
      }),
      [componentName, labels, version],
    ),
  );

  const latestSuccess = React.useMemo(
    () =>
      loaded &&
      !error &&
      pipelines?.find(
        (pipeline) =>
          matchesPipelineRunVersion(pipeline, version, labels) &&
          pipelineRunStatus(pipeline) === runStatus.Succeeded,
      ),
    [error, loaded, pipelines, labels, version],
  );

  const hasNextPage = nextPageProps?.hasNextPage ?? false;
  const isFetchingNextPage = nextPageProps?.isFetchingNextPage ?? false;
  React.useEffect(() => {
    if (loaded && !error && !latestSuccess && hasNextPage && !isFetchingNextPage && getNextPage) {
      getNextPage();
    }
  }, [loaded, error, getNextPage, latestSuccess, hasNextPage, isFetchingNextPage]);

  const searchComplete =
    loaded && (!!error || !!latestSuccess || (!hasNextPage && !isFetchingNextPage));
  return [latestSuccess, searchComplete, error];
};

export const useLatestPushBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
  version?: string,
  labels: PipelineRunLabelConfig = APPLICATION_PIPELINE_RUN_LABELS,
): [PipelineRunKind, boolean, unknown] => {
  const [pipelines, loaded, error, getNextPage, nextPageProps] = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: getPipelineRunSelector(componentName, labels, version),
          matchExpressions: [
            {
              key: PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL,
              operator: 'In',
              values: PUSH_BUILD_EVENT_TYPES,
            },
          ],
        },
        ...(version && !labels.versionSelector ? {} : { limit: 1 }),
      }),
      [componentName, labels, version],
    ),
  );

  const latestPushBuild = React.useMemo(
    () => pipelines?.find((pipeline) => matchesPipelineRunVersion(pipeline, version, labels)),
    [pipelines, labels, version],
  );
  const hasNextPage = nextPageProps?.hasNextPage ?? false;
  const isFetchingNextPage = nextPageProps?.isFetchingNextPage ?? false;
  React.useEffect(() => {
    if (loaded && !error && !latestPushBuild && hasNextPage && !isFetchingNextPage && getNextPage) {
      getNextPage();
    }
  }, [loaded, error, latestPushBuild, hasNextPage, isFetchingNextPage, getNextPage]);

  const searchComplete =
    loaded && (!!error || !!latestPushBuild || (!hasNextPage && !isFetchingNextPage));

  return [latestPushBuild, searchComplete, error];
};
