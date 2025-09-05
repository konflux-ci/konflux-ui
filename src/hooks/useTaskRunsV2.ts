import * as React from 'react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '../kubearchive/hooks';
import { TaskRunGroupVersionKind, TaskRunModel } from '../models';
import { TaskRunKind } from '../types';
import {
  createKubearchiveWatchResource,
  TaskRunSelector,
} from '../utils/task-run-filter-transforms';
import { TaskRunsOptions } from './useTaskRuns';
import { GetNextPage, NextPageProps, useTRTaskRuns } from './useTektonResults';

export type TaskRunsV2Options = TaskRunsOptions & {
  selector?: TaskRunSelector;
};

/**
 * Hook for fetching TaskRuns with feature flag controlled data source switching.
 *
 * When 'taskruns-kubearchive' feature flag is enabled, fetches from KubeArchive.
 * Otherwise, uses the existing Tekton Results implementation.
 *
 * Returns interface matches existing useTaskRuns exactly with infinite loading support.
 */
export const useTaskRunsV2 = (
  namespace: string,
  options?: TaskRunsV2Options,
  queryOptions?: { enabled?: boolean },
): [TaskRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const enableKubearchive = useIsOnFeatureFlag('taskruns-kubearchive');
  const isEnabled = (queryOptions?.enabled ?? options?.enabled) !== false;
  const watch = options?.watch !== false;

  //
  // Tekton Results implementation
  //
  const [tektonTaskRuns, tektonLoaded, tektonError, tektonGetNextPage, tektonNextPageProps] =
    useTRTaskRuns(!enableKubearchive && isEnabled && namespace ? namespace : null, {
      selector: options?.selector,
      limit: options?.limit,
    });

  //
  // KubeArchive implementation
  //
  const kubearchiveResourceInit = React.useMemo(() => {
    if (!enableKubearchive || !isEnabled || !namespace) return undefined;
    return {
      groupVersionKind: TaskRunGroupVersionKind,
      isList: true,
      watch,
      ...createKubearchiveWatchResource(namespace, options?.selector),
    };
  }, [enableKubearchive, isEnabled, namespace, options?.selector, watch]);

  const kubearchiveQuery = useKubearchiveListResourceQuery(kubearchiveResourceInit, TaskRunModel);

  const kubearchiveData = React.useMemo(() => {
    const pages = kubearchiveQuery.data?.pages;
    return pages?.flatMap((page) => page) ?? [];
  }, [kubearchiveQuery.data?.pages]);

  // Apply sorting and limit to KubeArchive data
  const processedKubearchiveData = React.useMemo(() => {
    if (!enableKubearchive) return [];

    const data = kubearchiveData as TaskRunKind[];
    const toKey = (tr?: TaskRunKind) => tr?.metadata?.creationTimestamp ?? '';
    // Sort by creationTimestamp (newest first); stable for equal keys
    const sorted = [...data].sort((a, b) => toKey(b).localeCompare(toKey(a)));

    // Apply limit if specified
    return options?.limit && options.limit > 0 ? sorted.slice(0, options.limit) : sorted;
  }, [enableKubearchive, kubearchiveData, options?.limit]);

  // Return the appropriate data based on feature flag
  return React.useMemo(() => {
    if (enableKubearchive) {
      const isLoading = !isEnabled || !namespace ? false : kubearchiveQuery.isLoading;
      const error = !isEnabled || !namespace ? undefined : kubearchiveQuery.error;
      const getNextPage = kubearchiveQuery.hasNextPage ? kubearchiveQuery.fetchNextPage : undefined;
      const nextPageProps = {
        hasNextPage: kubearchiveQuery.hasNextPage || false,
        isFetchingNextPage: kubearchiveQuery.isFetchingNextPage || false,
      };

      return [processedKubearchiveData, !isLoading, error, getNextPage, nextPageProps];
    }
    return [
      tektonTaskRuns || [],
      tektonLoaded,
      tektonError,
      tektonGetNextPage,
      tektonNextPageProps,
    ];
  }, [
    enableKubearchive,
    processedKubearchiveData,
    kubearchiveQuery.isLoading,
    kubearchiveQuery.error,
    kubearchiveQuery.hasNextPage,
    kubearchiveQuery.fetchNextPage,
    kubearchiveQuery.isFetchingNextPage,
    tektonTaskRuns,
    tektonLoaded,
    tektonError,
    tektonGetNextPage,
    tektonNextPageProps,
    isEnabled,
    namespace,
  ]);
};
