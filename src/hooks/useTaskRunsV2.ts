import * as React from 'react';
import { InfiniteData } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { TQueryInfiniteOptions } from '~/k8s/query/type';
import { WatchK8sResource } from '~/types/k8s';
import { has404Error } from '~/utils/common-utils';
import { EQ, TektonResultsOptions } from '~/utils/tekton-results';
import { useK8sWatchResource } from '../k8s';
import {
  useKubearchiveGetResourceQuery,
  useKubearchiveListResourceQuery,
} from '../kubearchive/hooks';
import { TaskRunGroupVersionKind, TaskRunModel } from '../models';
import { TaskRunKind, TektonResourceLabel } from '../types';
import { createKubearchiveWatchResource } from '../utils/kubearchive-filter-transform';
import { sortTaskRunsByTime } from './useTaskRuns';
import { GetNextPage, NextPageProps, useTRTaskRuns } from './useTektonResults';

/**
 * Hook for fetching TaskRuns with feature flag controlled data source switching.
 *
 * When 'taskruns-kubearchive' feature flag is enabled, combines live cluster data
 * via useK8sWatchResource with KubeArchive historical data for complete coverage.
 * Otherwise, uses the similar implementation for tekton results.
 *
 * Returns interface matches existing useTaskRuns exactly with infinite loading support.
 */
export const useTaskRunsV2 = (
  namespace: string,
  options?: Partial<Pick<WatchK8sResource, 'watch' | 'limit' | 'selector' | 'fieldSelector'>>,
  queryOptions?: TQueryInfiniteOptions<TaskRunKind[], Error, InfiniteData<TaskRunKind[], unknown>>,
): [TaskRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const enableKubearchive = useIsOnFeatureFlag('taskruns-kubearchive');

  // Live cluster data - always fetched for consistency
  const {
    data: clusterResources,
    isLoading: clusterLoading,
    error: clusterError,
  } = useK8sWatchResource<TaskRunKind[]>(
    namespace
      ? {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace,
          isList: true,
          selector: options?.selector,
          watch: options?.watch !== false,
        }
      : null,
    TaskRunModel,
    { retry: false },
  );

  // Process cluster data with sorting (no limit applied yet)
  const processedClusterData = React.useMemo(() => {
    if (clusterLoading || clusterError || !clusterResources) return [];

    const sorted = [...clusterResources].sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );

    return sorted;
  }, [clusterResources, clusterLoading, clusterError]);

  // should query when there is no limit or no enough data in cluster or cluster meets error
  const needsMoreData =
    !clusterLoading &&
    (!options?.limit || // no limit case
      (clusterResources && options.limit > clusterResources.length) || // not enough data
      !!clusterError); // error after load

  const shouldQueryTekton =
    !enableKubearchive && namespace && needsMoreData && (queryOptions?.enabled ?? true);
  const shouldQueryKubearchive =
    enableKubearchive && namespace && needsMoreData && (queryOptions?.enabled ?? true);

  // Warn if querying KubeArchive without timestamp filter for performance
  React.useEffect(() => {
    if (shouldQueryKubearchive && !options?.fieldSelector) {
      // eslint-disable-next-line no-console
      console.warn(
        'useTaskRunsV2: Querying KubeArchive without timestamp filter may have poor performance. Consider providing creationTimestamp filtering via fieldSelector.',
      );
    }
  }, [shouldQueryKubearchive, options?.fieldSelector]);

  // tekton historical data - only when we need more data
  const [tektonTaskRuns, tektonLoaded, tektonError, tektonGetNextPage, tektonNextPageProps] =
    useTRTaskRuns(
      shouldQueryTekton ? namespace : null,
      {
        selector: options?.selector,
        limit: options?.limit,
      } as TektonResultsOptions,
      { ...(queryOptions ?? {}), enabled: shouldQueryTekton },
    );

  // KubeArchive historical data - only when we need more data
  const kubearchiveQuery = useKubearchiveListResourceQuery<TaskRunKind>(
    {
      groupVersionKind: TaskRunGroupVersionKind,
      isList: true,
      ...createKubearchiveWatchResource(namespace, options?.selector),
      // Pass fieldSelector directly for timestamp filtering
      fieldSelector: options?.fieldSelector,
    },
    TaskRunModel,
    {
      ...(queryOptions ?? {}),
      enabled: shouldQueryKubearchive,
    },
  );

  // Combine and return data based on feature flag
  return React.useMemo(() => {
    let combinedData: TaskRunKind[] = [];

    if (!enableKubearchive) {
      // Legacy: cluster + Tekton
      combinedData = uniqBy(
        [...processedClusterData, ...(tektonTaskRuns || [])],
        (r) => r.metadata?.uid,
      );
    } else {
      // KubeArchive: cluster + archive
      const archiveData = kubearchiveQuery.data?.pages?.flatMap((page) => page) ?? [];
      combinedData = uniqBy([...processedClusterData, ...archiveData], (r) => r.metadata?.uid);

      combinedData.sort((a, b) =>
        (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
      );
    }

    if (options?.limit && options.limit < combinedData.length) {
      combinedData = combinedData.slice(0, options.limit);
    }

    // Unified loading, error, pagination
    const loaded = (() => {
      if (!namespace) return false;

      if (!enableKubearchive) {
        return shouldQueryTekton ? tektonLoaded && !clusterLoading : !clusterLoading;
      }

      return !(clusterLoading || kubearchiveQuery.isLoading);
    })();

    const error = (() => {
      if (!namespace) return null;

      if (!enableKubearchive) {
        return shouldQueryTekton ? tektonError || clusterError : clusterError;
      }

      return clusterError || kubearchiveQuery.error;
    })();

    const getNextPage = !enableKubearchive ? tektonGetNextPage : kubearchiveQuery.fetchNextPage;

    const nextPageProps: NextPageProps = !enableKubearchive
      ? tektonNextPageProps
      : {
          hasNextPage: kubearchiveQuery.hasNextPage || false,
          isFetchingNextPage: kubearchiveQuery.isFetchingNextPage || false,
        };

    return [combinedData, loaded, error, getNextPage, nextPageProps];
  }, [
    enableKubearchive,
    kubearchiveQuery.data?.pages,
    kubearchiveQuery.isLoading,
    kubearchiveQuery.error,
    kubearchiveQuery.hasNextPage,
    kubearchiveQuery.fetchNextPage,
    kubearchiveQuery.isFetchingNextPage,
    processedClusterData,
    options?.limit,
    namespace,
    clusterLoading,
    clusterError,
    tektonTaskRuns,
    shouldQueryTekton,
    tektonLoaded,
    tektonError,
    tektonGetNextPage,
    tektonNextPageProps,
  ]);
};

/**
 * Hook for fetching TaskRuns associated with a specific PipelineRun.
 *
 * The `taskruns-kubearchive` feature flag controls which data source is used:
 * - Enabled  → fetches data from KubeArchive
 * - Disabled → falls back to Tekton Results
 *
 * This hook relies on `useTaskRunsV2(namespace, { selector })`.
 * It is intended to replace `useTaskRuns` in the future.
 *
 *
 * @param namespace - Kubernetes namespace
 * @param pipelineRunName - Name of the pipeline run to fetch TaskRuns for
 * @param taskName - Optional specific task name to filter by
 * @param pipelineRunCreationTimestamp - Creation timestamp of the pipeline run (ISO 8601 format) for query optimization
 * @param watch - Whether to watch for real-time updates (default: true). Set to false for completed pipeline runs.
 * @returns Tuple of [taskRuns, loaded, error] sorted by completion time
 */
export const useTaskRunsForPipelineRuns = (
  namespace: string,
  pipelineRunName: string,
  taskName?: string,
  pipelineRunCreationTimestamp?: string,
  watch: boolean = true,
): [TaskRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const selector = React.useMemo(
    () => ({
      matchLabels: {
        [TektonResourceLabel.pipelinerun]: pipelineRunName,
      },
    }),
    [pipelineRunName],
  );

  const fieldSelector = React.useMemo(() => {
    if (!pipelineRunCreationTimestamp) {
      return undefined;
    }

    try {
      const creationTime = new Date(pipelineRunCreationTimestamp);
      const timestampAfter = pipelineRunCreationTimestamp;
      const timestampBefore = new Date(creationTime.getTime() + 24 * 60 * 60 * 1000).toISOString();

      return `creationTimestampAfter=${timestampAfter},creationTimestampBefore=${timestampBefore}`;
    } catch (error) {
      // If timestamp parsing fails, don't use fieldSelector
      return undefined;
    }
  }, [pipelineRunCreationTimestamp]);

  const [taskRuns, loaded, error, getNextPage, nextPageProps] = useTaskRunsV2(
    namespace,
    {
      selector,
      fieldSelector,
      watch,
    },
    { staleTime: Infinity, enabled: !!(namespace && pipelineRunName) },
  );

  const sortedTaskRuns = React.useMemo(() => {
    if (taskName) {
      // used taskName here instead of api call to filter by task name because we cache all the task runs for a pipeline run,
      // it's better we filter here instead of in the api call to avoid unnecessary api calls
      return taskRuns.filter(
        (tr) => tr.metadata?.labels?.[TektonResourceLabel.pipelineTask] === taskName,
      );
    }
    return sortTaskRunsByTime(taskRuns);
  }, [taskRuns, taskName]);

  return [sortedTaskRuns, loaded, error, getNextPage, nextPageProps];
};

export const useTaskRunV2 = (
  namespace: string,
  taskRunName: string,
): [TaskRunKind | null | undefined, boolean, unknown] => {
  const isKubeArchiveOn = useIsOnFeatureFlag('taskruns-kubearchive');
  const enabled = !!namespace && !!taskRunName;

  // k8s query
  const k8sQuery = useK8sWatchResource<TaskRunKind>(
    enabled
      ? {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace,
          name: taskRunName,
          watch: true,
        }
      : null,
    TaskRunModel,
    { retry: false },
  );

  const is404Error = k8sQuery.isError && has404Error(k8sQuery.error);

  // kubearachive query
  const kubearchiveQuery = useKubearchiveGetResourceQuery(
    {
      groupVersionKind: TaskRunGroupVersionKind,
      namespace,
      name: taskRunName,
    },
    TaskRunModel,
    {
      enabled: isKubeArchiveOn && enabled && is404Error,
      staleTime: Infinity,
    },
  );

  // tekton-results query
  const tektonResultsQuery = useTRTaskRuns(
    !isKubeArchiveOn && enabled && is404Error ? namespace : null,
    React.useMemo(
      () => ({
        name: taskRunName,
        limit: 1,
        filter: EQ('data.metadata.name', taskRunName),
      }),
      [taskRunName],
    ),
    {
      staleTime: Infinity,
    },
  );

  return React.useMemo(() => {
    if (k8sQuery.data) {
      return [k8sQuery.data, !k8sQuery.isLoading, k8sQuery.error];
    }

    if (isKubeArchiveOn) {
      if (kubearchiveQuery.data) {
        return [
          kubearchiveQuery.data as TaskRunKind,
          !kubearchiveQuery.isLoading,
          kubearchiveQuery.error,
        ];
      }

      const isLoading = k8sQuery.isLoading || kubearchiveQuery.isLoading;
      return [kubearchiveQuery.data as TaskRunKind, !isLoading, kubearchiveQuery.error];
    }

    const [trData, trLoaded, trError] = tektonResultsQuery;
    if (trData?.[0]) {
      return [trData[0], trLoaded, trError];
    }

    const isLoading = k8sQuery.isLoading || !trLoaded;
    const error = trError || k8sQuery.error;
    return [undefined, !isLoading, error];
  }, [
    k8sQuery.data,
    k8sQuery.isLoading,
    k8sQuery.error,
    isKubeArchiveOn,
    tektonResultsQuery,
    kubearchiveQuery.data,
    kubearchiveQuery.isLoading,
    kubearchiveQuery.error,
  ]);
};
