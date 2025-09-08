import * as React from 'react';
import { uniqBy } from 'lodash-es';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { WatchK8sResource } from '~/types/k8s';
import { useK8sWatchResource } from '../k8s';
import { useKubearchiveListResourceQuery } from '../kubearchive/hooks';
import { TaskRunGroupVersionKind, TaskRunModel } from '../models';
import { TaskRunKind } from '../types';
import { createKubearchiveWatchResource } from '../utils/task-run-filter-transforms';
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
          selector: options?.selector?.matchLabels
            ? { matchLabels: options.selector.matchLabels }
            : undefined,
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

  // should query when there is no limit or no enough data in cluster
  const needsMoreData =
    !options?.limit ||
    (clusterResources && !clusterLoading && options.limit > clusterResources.length) ||
    clusterError;

  const shouldQueryTekton = !enableKubearchive && needsMoreData;
  const shouldQueryKubearchive = enableKubearchive && needsMoreData;

  // tekton historical data - only when we need more data
  const [tektonTaskRuns, tektonLoaded, tektonError, tektonGetNextPage, tektonNextPageProps] =
    useTRTaskRuns(shouldQueryTekton && namespace ? namespace : null, {
      selector: options?.selector,
      limit: options?.limit,
    } as TektonResultsOptions); // useTRTaskRuns only accept two paramets: namespaces and options

  // KubeArchive historical data - only when we need more data
  const kubearchiveQuery = useKubearchiveListResourceQuery(
    shouldQueryKubearchive && namespace
      ? {
          groupVersionKind: TaskRunGroupVersionKind,
          isList: true,
          watch: options?.watch !== false,
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
        (r) => r.metadata?.name,
      );
    } else {
      // KubeArchive: cluster + archive
      const archiveData = (kubearchiveQuery.data?.pages?.flatMap((page) => page) ??
        []) as TaskRunKind[];
      combinedData = uniqBy([...processedClusterData, ...archiveData], (r) => r.metadata?.name);

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

    const getNextPage = !enableKubearchive
      ? tektonGetNextPage
      : kubearchiveQuery.hasNextPage
        ? kubearchiveQuery.fetchNextPage
        : undefined;

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
