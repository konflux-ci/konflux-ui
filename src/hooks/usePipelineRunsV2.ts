import * as React from 'react';
import { differenceBy, uniqBy } from 'lodash-es';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveGetResourceQuery, useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { createKubearchiveWatchResource, PipelineRunSelector } from '~/utils/pipeline-run-filter-transform';
import { EQ } from '~/utils/tekton-results';
import { useK8sWatchResource } from '../k8s';
import { PipelineRunGroupVersionKind, PipelineRunModel } from '../models';
import { useDeepCompareMemoize } from '../shared';
import { PipelineRunKind } from '../types';
import { WatchK8sResource } from '../types/k8s';
import { getCommitSha } from '../utils/commits-utils';
import { GetNextPage, NextPageProps, useTRPipelineRuns } from './useTektonResults';

/**
 * Options for usePipelineRunsV2 hook, extending WatchK8sResource options
 */
interface UsePipelineRunsV2Options
  extends Partial<Pick<WatchK8sResource, 'watch' | 'limit' | 'fieldSelector'>> {
  selector?: PipelineRunSelector;
}

/**
 * Return type for usePipelineRunsV2 hook
 */
type UsePipelineRunsV2Result = [
  data: PipelineRunKind[],
  loaded: boolean,
  error: unknown,
  getNextPage: GetNextPage,
  nextPageProps: NextPageProps,
];

/**
 * Hook for fetching PipelineRuns with feature flag controlled data source switching.
 *
 * When 'pipelineruns-kubearchive' feature flag is enabled, combines live cluster data
 * via useK8sWatchResource with KubeArchive historical data for complete coverage.
 * Otherwise, uses Tekton Results for historical data.
 *
 * @param namespace - Kubernetes namespace (null disables the hook)
 * @param options - Configuration options extending WatchK8sResource
 * @returns Tuple of [data, loaded, error, getNextPage, nextPageProps]
 */
export const usePipelineRunsV2 = (
  namespace: string | null,
  options?: UsePipelineRunsV2Options,
): UsePipelineRunsV2Result => {
  const etcdRunsRef = React.useRef<PipelineRunKind[]>([]);
  const optionsMemo = useDeepCompareMemoize(options);
  const kubearchiveEnabled = useIsOnFeatureFlag('pipelineruns-kubearchive');
  // Build watch options for live cluster data (exclude limit due to unsorted results from etcd)
  const watchOptions = React.useMemo<WatchK8sResource | null>(() => {
    // reset cached runs as the options have changed
    etcdRunsRef.current = [];

    if (!namespace) {
      return null;
    }

    return {
      groupVersionKind: PipelineRunGroupVersionKind,
      namespace,
      isList: true,
      selector: optionsMemo?.selector,
      fieldSelector: optionsMemo?.fieldSelector,
      watch: optionsMemo?.watch !== false, // Default to true, allow explicit false
    };
  }, [namespace, optionsMemo?.selector, optionsMemo?.fieldSelector, optionsMemo?.watch]);
  const {
    data: resources,
    isLoading,
    error,
  } = useK8sWatchResource<PipelineRunKind[]>(watchOptions, PipelineRunModel, { retry: false });
  // if a pipeline run was removed from etcd, we want to still include it in the return value without re-querying tekton-results
  // Client-side commit filtering using getCommitSha() for comprehensive coverage
  const etcdRuns = React.useMemo((): PipelineRunKind[] => {
    if (isLoading || error || !resources) {
      return [];
    }

    if (!optionsMemo?.selector?.filterByCommit) {
      return resources;
    }

    return resources.filter((plr) => getCommitSha(plr) === optionsMemo.selector.filterByCommit);
  }, [optionsMemo?.selector?.filterByCommit, resources, isLoading, error]);

  const runs = React.useMemo((): PipelineRunKind[] => {
    if (!etcdRuns.length) {
      return etcdRuns;
    }

    // Combine current etcd runs with previously cached runs that may have been removed
    let combinedRuns =
      etcdRunsRef.current.length > 0
        ? [
            ...etcdRuns,
            // Include runs that were removed from etcd but should still be displayed
            ...differenceBy(etcdRunsRef.current, etcdRuns, (plr) => plr.metadata?.uid),
          ]
        : etcdRuns;

    // Sort by creation timestamp (newest first)
    combinedRuns.sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );

    // Apply limit if specified
    if (optionsMemo?.limit && optionsMemo.limit < combinedRuns.length) {
      combinedRuns = combinedRuns.slice(0, optionsMemo.limit);
    }

    return combinedRuns;
  }, [etcdRuns, optionsMemo?.limit]);

  // cache the last set to identify removed runs
  etcdRunsRef.current = runs;

  const processedClusterData = React.useMemo((): PipelineRunKind[] => {
    if (isLoading || error || !resources) {
      return [];
    }

    // Sort by creation timestamp (newest first) - create copy to avoid mutation
    return resources.sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );
  }, [resources, isLoading, error]);

  // Determine if we should query external data sources (Tekton Results or KubeArchive)
  const shouldQueryExternalSources = React.useMemo(() => {
    // Don't query if no namespace is provided
    if (!namespace) {
      return false;
    }

    // Always query if no limit is specified (we want all available data)
    if (!options?.limit) {
      return true;
    }

    // Query if we have insufficient cluster data to meet the requested limit
    if (processedClusterData.length < options.limit) {
      return true;
    }

    // Query if there's an error with cluster data (external sources might have data)
    if (error) {
      return true;
    }

    // Don't query if we already have enough data from the cluster
    return false;
  }, [namespace, options?.limit, processedClusterData.length, error]);

  // Query tekton results based on external query decision and feature flag
  const queryTr = !kubearchiveEnabled && shouldQueryExternalSources;

  // tekton-results includes items in etcd, therefore options must use the same limit
  // these duplicates will later be de-duped
  const [trResourcesRaw, trLoaded, trError, trGetNextPage, nextPageProps] = useTRPipelineRuns(
    queryTr ? namespace : null,
    optionsMemo,
  );

  // Client-side commit filtering for Tekton Results data using getCommitSha() for comprehensive coverage
  const trResources = React.useMemo((): PipelineRunKind[] => {
    if (!trResourcesRaw || trResourcesRaw.length === 0) {
      return [];
    }

    // Apply commit filtering if specified - same logic as etcd and KubeArchive filtering
    if (optionsMemo?.selector?.filterByCommit) {
      // Use getCommitSha() to check all possible commit SHA locations:
      // - Labels: 'pipelinesascode.tekton.dev/sha', 'pac.test.appstudio.openshift.io/sha'
      // - Annotations: 'build.appstudio.redhat.com/commit_sha', 'pac.test.appstudio.openshift.io/sha'
      // This ensures consistent filtering across etcd, KubeArchive, and Tekton Results data sources
      return trResourcesRaw.filter((plr) => getCommitSha(plr) === optionsMemo.selector.filterByCommit);
    }

    return trResourcesRaw;
  }, [trResourcesRaw, optionsMemo?.selector?.filterByCommit]);

  //kubearchive results
  const resourceInit = React.useMemo(
    () =>
      kubearchiveEnabled && shouldQueryExternalSources
        ? {
            groupVersionKind: PipelineRunGroupVersionKind,
            namespace,
            ...createKubearchiveWatchResource(namespace, options?.selector),
            isList: true,
            limit: options?.limit || 200,
          }
        : undefined,
    [namespace, options?.limit, options?.selector, kubearchiveEnabled, shouldQueryExternalSources],
  );

  const kubearchiveResult = useKubearchiveListResourceQuery(resourceInit, PipelineRunModel);

  // Client-side commit filtering for KubeArchive data using getCommitSha() for comprehensive coverage
  const kubearchiveData = React.useMemo((): PipelineRunKind[] => {
    if (!kubearchiveEnabled) return [];

    const pages = kubearchiveResult.data?.pages;
    const archiveData = pages?.flatMap((page) => page) ?? [];
    let data = archiveData as PipelineRunKind[];

    // Apply commit filtering if specified - same logic as etcd filtering
    if (optionsMemo?.selector?.filterByCommit) {
      // Use getCommitSha() to check all possible commit SHA locations:
      // - Labels: 'pipelinesascode.tekton.dev/sha', 'pac.test.appstudio.openshift.io/sha'
      // - Annotations: 'build.appstudio.redhat.com/commit_sha', 'pac.test.appstudio.openshift.io/sha'
      // This ensures consistent filtering between etcd and KubeArchive data sources
      data = data.filter((plr) => getCommitSha(plr) === optionsMemo.selector.filterByCommit);
    }

    const creationTimestamp = (tr?: PipelineRunKind) => tr?.metadata?.creationTimestamp ?? '';
    // Sort by creationTimestamp (newest first); stable for equal keys
    const sorted = data.sort((a, b) => creationTimestamp(b).localeCompare(creationTimestamp(a)));

    // Apply limit if specified
    return optionsMemo?.limit && optionsMemo.limit > 0 ? sorted.slice(0, optionsMemo.limit) : sorted;
  }, [kubearchiveResult.data?.pages, kubearchiveEnabled, optionsMemo?.limit, optionsMemo?.selector?.filterByCommit]);

  // Combine cluster data with external data source results based on feature flag
  const combinedData = React.useMemo((): PipelineRunKind[] => {
    // Merge cluster data with external source data
    const mergedData = uniqBy(
      [...processedClusterData, ...(kubearchiveEnabled ? kubearchiveData : trResources || [])],
      (r) => r.metadata?.uid,
    );

    // Sort by creation timestamp (newest first)
    const sortedData = mergedData.sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );

    // Apply limit if specified
    return optionsMemo?.limit && optionsMemo.limit < sortedData.length
      ? sortedData.slice(0, optionsMemo.limit)
      : sortedData;
  }, [kubearchiveEnabled, processedClusterData, kubearchiveData, trResources, optionsMemo?.limit]);

  // Optimize loading states with dedicated variables
  const isLoadingCluster = React.useMemo(() => {
    return !!namespace && isLoading;
  }, [namespace, isLoading]);

  const isLoadingKubeArchive = React.useMemo(() => {
    return kubearchiveEnabled && !!namespace && kubearchiveResult.isLoading;
  }, [kubearchiveEnabled, namespace, kubearchiveResult.isLoading]);

  const isLoadingTektonResults = React.useMemo(() => {
    return !kubearchiveEnabled && queryTr && !trLoaded;
  }, [kubearchiveEnabled, queryTr, trLoaded]);

  // Compute final loading state based on active data sources
  const isFullyLoaded = React.useMemo(() => {
    if (!namespace) {
      return false;
    }

    // When KubeArchive is enabled, wait for both cluster and archive data
    if (kubearchiveEnabled) {
      return !isLoadingCluster && !isLoadingKubeArchive;
    }

    // When using Tekton Results, wait for cluster and (if queried) Tekton Results
    return !isLoadingCluster && !isLoadingTektonResults;
  }, [
    namespace,
    kubearchiveEnabled,
    isLoadingCluster,
    isLoadingKubeArchive,
    isLoadingTektonResults,
  ]);

  return React.useMemo((): UsePipelineRunsV2Result => {
    if (!namespace) {
      return [[], false, null, undefined, { hasNextPage: false, isFetchingNextPage: false }];
    }

    const hookError = kubearchiveEnabled ? kubearchiveResult.error || error : trError || error;

    const getNextPage: GetNextPage = kubearchiveEnabled
      ? kubearchiveResult.hasNextPage
        ? kubearchiveResult.fetchNextPage
        : undefined
      : trGetNextPage;

    const nextPagePropsState: NextPageProps = kubearchiveEnabled
      ? {
          hasNextPage: kubearchiveResult.hasNextPage || false,
          isFetchingNextPage: kubearchiveResult.isFetchingNextPage || false,
        }
      : nextPageProps;

    return [combinedData, isFullyLoaded, hookError, getNextPage, nextPagePropsState];
  }, [
    namespace,
    combinedData,
    isFullyLoaded,
    kubearchiveEnabled,
    kubearchiveResult.error,
    kubearchiveResult.hasNextPage,
    kubearchiveResult.fetchNextPage,
    kubearchiveResult.isFetchingNextPage,
    error,
    trError,
    trGetNextPage,
    nextPageProps,
  ]);
};



export const usePipelineRunV2 = (
  namespace: string,
  pipelineRunName: string,
): [PipelineRunKind, boolean, unknown] => {
  const kubearchiveEnabled = useIsOnFeatureFlag('pipelineruns-kubearchive');
  const enabled = !!namespace && !!pipelineRunName;

  const resourceInit = React.useMemo(
    () =>
      enabled
        ? {
            groupVersionKind: PipelineRunGroupVersionKind,
            namespace,
            watch: true,
            isList: false,
            name: pipelineRunName,
            limit: 1,
          }
        : null,
    [namespace, pipelineRunName, enabled],
  );

  const clusterResult = useK8sWatchResource<PipelineRunKind>(resourceInit, PipelineRunModel, {
    retry: false,
  });

  const tektonResult = useTRPipelineRuns(
    enabled && !kubearchiveEnabled ? namespace : undefined,
    React.useMemo(
      () => ({
        filter: EQ('data.metadata.name', pipelineRunName),
        limit: 1,
      }),
      [pipelineRunName],
    ),
  );

  const kubearchiveResult = useKubearchiveGetResourceQuery(resourceInit, PipelineRunModel, {
    enabled: enabled && kubearchiveEnabled,
  });

  return React.useMemo(() => {
    if (!enabled) {
      return [undefined, false, undefined];
    }

    if (clusterResult.data) {
      return [clusterResult.data, !clusterResult.isLoading, clusterResult.error];
    }

    if (kubearchiveEnabled) {
      return [
        kubearchiveResult.data as PipelineRunKind,
        !kubearchiveResult.isLoading,
        kubearchiveResult.error,
      ];
    }

    return [tektonResult[0]?.[0], tektonResult[1], tektonResult[2]];
  }, [
    enabled,
    clusterResult.data,
    clusterResult.isLoading,
    clusterResult.error,
    kubearchiveEnabled,
    kubearchiveResult.data,
    kubearchiveResult.isLoading,
    kubearchiveResult.error,
    tektonResult,
  ]);
};
