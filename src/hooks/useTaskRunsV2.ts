import * as React from 'react';
import { uniqBy } from 'lodash-es';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { WatchK8sResource } from '~/types/k8s';
import { useK8sWatchResource } from '../k8s';
import { useKubearchiveListResourceQuery } from '../kubearchive/hooks';
import { TaskRunGroupVersionKind, TaskRunModel } from '../models';
import { TaskRunKind, TektonResourceLabel } from '../types';
import { createKubearchiveWatchResource } from '../utils/task-run-filter-transforms';
import { sortTaskRunsByTime } from './useTaskRuns';
import { GetNextPage, NextPageProps, useTRTaskRuns } from './useTektonResults';
// eslint-disable-next-line import/order
import { TektonResultsOptions } from '~/utils/tekton-results';

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
          fieldSelector: options?.fieldSelector,
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

  const shouldQueryTekton = !enableKubearchive && namespace && needsMoreData;
  const shouldQueryKubearchive = enableKubearchive && namespace && needsMoreData;

  // tekton historical data - only when we need more data
  const [tektonTaskRuns, tektonLoaded, tektonError, tektonGetNextPage, tektonNextPageProps] =
    useTRTaskRuns(shouldQueryTekton ? namespace : null, {
      selector: options?.selector,
      limit: options?.limit,
    } as TektonResultsOptions); // useTRTaskRuns only accept two paramets: namespaces and options

  // KubeArchive historical data - only when we need more data
  const kubearchiveQuery = useKubearchiveListResourceQuery(
    shouldQueryKubearchive
      ? {
          groupVersionKind: TaskRunGroupVersionKind,
          isList: true,
          ...createKubearchiveWatchResource(namespace, options?.selector),
        }
      : undefined,
    TaskRunModel,
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
      const archiveData = (kubearchiveQuery.data?.pages?.flatMap((page) => page) ??
        []) as TaskRunKind[];
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
 * @returns Tuple of [taskRuns, loaded, error] sorted by completion time
 */
export const useTaskRunsForPipelineRuns = (
  namespace: string,
  pipelineRunName: string,
  taskName?: string,
): [TaskRunKind[], boolean, unknown] => {
  const selector = React.useMemo(
    () => ({
      matchLabels: {
        [TektonResourceLabel.pipelinerun]: pipelineRunName,
        ...(taskName ? { [TektonResourceLabel.pipelineTask]: taskName } : {}),
      },
    }),
    [pipelineRunName, taskName],
  );

  const [taskRuns, loaded, error] = useTaskRunsV2(namespace, { selector });

  const sortedTaskRuns = React.useMemo(() => sortTaskRunsByTime(taskRuns), [taskRuns]);

  return React.useMemo(() => [sortedTaskRuns, loaded, error], [sortedTaskRuns, loaded, error]);
};
