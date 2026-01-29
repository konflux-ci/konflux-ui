import * as React from 'react';
import { InfiniteData } from '@tanstack/react-query';
import { differenceBy, uniqBy } from 'lodash-es';
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
  const etcdRunsRef = React.useRef<TaskRunKind[]>([]);

  const watchOptions = React.useMemo<WatchK8sResource | null>(() => {
    etcdRunsRef.current = [];

    if (!namespace) {
      return null;
    }

    return {
      groupVersionKind: TaskRunGroupVersionKind,
      namespace,
      isList: true,
      selector: options?.selector,
      fieldSelector: options?.fieldSelector,
      watch: options?.watch !== false,
    };
  }, [namespace, options?.selector, options?.fieldSelector, options?.watch]);

  // Live cluster data - always fetched for consistency
  const {
    data: clusterResources,
    isLoading: clusterLoading,
    error: clusterError,
  } = useK8sWatchResource<TaskRunKind[]>(watchOptions, TaskRunModel, { retry: false });

  const etcdRuns = React.useMemo((): TaskRunKind[] => {
    if (clusterLoading || clusterError || !clusterResources) {
      return [];
    }

    return clusterResources;
  }, [clusterLoading, clusterError, clusterResources]);

  const runs = React.useMemo((): TaskRunKind[] => {
    if (!etcdRuns) {
      return etcdRuns;
    }

    const combinedRuns =
      etcdRunsRef.current.length > 0
        ? [
            ...etcdRuns,
            ...differenceBy(etcdRunsRef.current, etcdRuns, (taskRun) => taskRun.metadata?.uid),
          ]
        : etcdRuns;

    return combinedRuns;
  }, [etcdRuns]);

  etcdRunsRef.current = runs;

  // Process cluster data with sorting (no limit applied yet)
  const processedClusterData = React.useMemo(() => {
    if (clusterLoading || clusterError || !runs) return [];

    const sorted = [...runs].sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );

    return sorted;
  }, [runs, clusterLoading, clusterError]);

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
 * @param watch - Whether to watch for real-time updates (default: true). Set to false for completed pipeline runs.
 * @returns Tuple of [taskRuns, loaded, error] sorted by completion time
 */
export const useTaskRunsForPipelineRuns = (
  namespace: string,
  pipelineRunName: string,
  taskName?: string,
  watch: boolean = true,
): [TaskRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const selector = React.useMemo(
    () => ({
      matchLabels: {
        [TektonResourceLabel.pipelinerun]: pipelineRunName,
        ...(taskName && { [TektonResourceLabel.pipelineTask]: taskName }),
      },
    }),
    [pipelineRunName, taskName],
  );

  const [taskRuns, loaded, error, getNextPage, nextPageProps] = useTaskRunsV2(
    namespace,
    {
      selector,
      watch,
    },
    { staleTime: Infinity, enabled: !!(namespace && pipelineRunName) },
  );

  const sortedTaskRuns = React.useMemo(() => sortTaskRunsByTime(taskRuns), [taskRuns]);

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
    if (k8sQuery.data && !is404Error) {
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
    is404Error,
    isKubeArchiveOn,
    tektonResultsQuery,
    kubearchiveQuery.data,
    kubearchiveQuery.isLoading,
    kubearchiveQuery.error,
  ]);
};
