import * as React from 'react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '../kubearchive/hooks';
import { TaskRunGroupVersionKind, TaskRunModel } from '../models';
import { useDeepCompareMemoize } from '../shared';
import { TaskRunKind } from '../types';
import {
  createKubearchiveWatchResource,
  TaskRunSelector,
} from '../utils/task-run-filter-transforms';
import { GetNextPage, NextPageProps, useTRTaskRuns } from './useTektonResults';

export interface UseTaskRunsV2Options {
  selector?: TaskRunSelector;
  limit?: number;
  enabled?: boolean;
  watch?: boolean;
}

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
  options?: UseTaskRunsV2Options,
): [TaskRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const enableKubearchive = useIsOnFeatureFlag('taskruns-kubearchive');
  const optionsMemo = useDeepCompareMemoize(options);
  const enabledMomo = optionsMemo?.enabled !== false;
  const watch = optionsMemo?.watch !== false;

  // Always call all hooks unconditionally to follow Rules of Hooks

  // Tekton Results implementation
  const [trTaskRuns, trLoaded, trError, trGetNextPage, trNextPageProps] = useTRTaskRuns(
    !enableKubearchive && enabledMomo && namespace ? namespace : null,
    {
      selector: optionsMemo?.selector,
      limit: optionsMemo?.limit,
    },
  );

  // KubeArchive implementation
  const kubearchiveResourceInit = React.useMemo(() => {
    if (enableKubearchive && enabledMomo && namespace) {
      const watchResource = createKubearchiveWatchResource(namespace, optionsMemo?.selector);
      return {
        groupVersionKind: TaskRunGroupVersionKind,
        namespace: watchResource.namespace,
        isList: true,
        selector: watchResource.selector,
        fieldSelector: watchResource.fieldSelector,
        watch,
      };
    }
    return undefined;
  }, [enableKubearchive, enabledMomo, namespace, optionsMemo?.selector, watch]);

  const kubearchiveQuery = useKubearchiveListResourceQuery(kubearchiveResourceInit, TaskRunModel);

  // Process KubeArchive data with infinite loading support
  const kubearchiveData = React.useMemo(() => {
    if (!enableKubearchive) return [];
    return kubearchiveQuery.data?.pages ? kubearchiveQuery.data.pages.flatMap((page) => page) : [];
  }, [enableKubearchive, kubearchiveQuery.data?.pages]);

  // Apply sorting and limit to KubeArchive data
  const processedKubearchiveData = React.useMemo(() => {
    if (!enableKubearchive) return [];

    const data = kubearchiveData as TaskRunKind[];
    const toKey = (tr?: TaskRunKind) => tr?.metadata?.creationTimestamp ?? '';
    // Sort by creationTimestamp (newest first); stable for equal keys
    const sorted = [...data].sort((a, b) => toKey(b).localeCompare(toKey(a)));

    // Apply limit if specified
    return optionsMemo?.limit && optionsMemo.limit > 0
      ? sorted.slice(0, optionsMemo.limit)
      : sorted;
  }, [enableKubearchive, kubearchiveData, optionsMemo?.limit]);

  // Return the appropriate data based on feature flag
  return React.useMemo(() => {
    if (enableKubearchive) {
      const isLoading = !enabledMomo || !namespace ? false : kubearchiveQuery.isLoading;
      const error = !enabledMomo || !namespace ? undefined : kubearchiveQuery.error;
      const getNextPage = kubearchiveQuery.hasNextPage ? kubearchiveQuery.fetchNextPage : undefined;
      const nextPageProps = {
        hasNextPage: kubearchiveQuery.hasNextPage || false,
        isFetchingNextPage: kubearchiveQuery.isFetchingNextPage || false,
      };

      return [processedKubearchiveData, !isLoading, error, getNextPage, nextPageProps];
    }
    return [trTaskRuns || [], trLoaded, trError, trGetNextPage, trNextPageProps];
  }, [
    enableKubearchive,
    processedKubearchiveData,
    kubearchiveQuery.isLoading,
    kubearchiveQuery.error,
    kubearchiveQuery.hasNextPage,
    kubearchiveQuery.fetchNextPage,
    kubearchiveQuery.isFetchingNextPage,
    trTaskRuns,
    trLoaded,
    trError,
    trGetNextPage,
    trNextPageProps,
    enabledMomo,
    namespace,
  ]);
};
