import * as React from 'react';
import { differenceBy, uniqBy } from 'lodash-es';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import {
  useKubearchiveGetResourceQuery,
  useKubearchiveListResourceQuery,
} from '~/kubearchive/hooks';
import {
  createKubearchiveWatchResource,
  KubearchiveFilterTransformSelector,
} from '~/utils/kubearchive-filter-transform';
import { EQ } from '~/utils/tekton-results';
import { useK8sWatchResource } from '../k8s';
import { PipelineRunGroupVersionKind, PipelineRunModel } from '../models';
import { useDeepCompareMemoize } from '../shared';
import { PipelineRunKind } from '../types';
import { WatchK8sResource } from '../types/k8s';
import { getCommitSha } from '../utils/commits-utils';
import { has404Error } from '../utils/common-utils';
import { GetNextPage, NextPageProps, useTRPipelineRuns } from './useTektonResults';

interface UsePipelineRunsV2Options
  extends Partial<Pick<WatchK8sResource, 'watch' | 'limit' | 'fieldSelector'>> {
  selector?: KubearchiveFilterTransformSelector;
}

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
  // Build watch options for live cluster data; exclude `limit` (etcd order is not stable)
  const watchOptions = React.useMemo<WatchK8sResource | null>(() => {
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
      watch: optionsMemo?.watch !== false,
    };
  }, [namespace, optionsMemo?.selector, optionsMemo?.fieldSelector, optionsMemo?.watch]);
  const {
    data: resources,
    isLoading,
    error,
  } = useK8sWatchResource<PipelineRunKind[]>(watchOptions, PipelineRunModel, { retry: false });
  // Cluster results with optional commit filtering
  const etcdRuns = React.useMemo((): PipelineRunKind[] => {
    if (isLoading || error || !resources) {
      return [];
    }

    if (!optionsMemo?.selector?.filterByCommit) {
      return resources;
    }

    return resources.filter((plr) => getCommitSha(plr) === optionsMemo.selector.filterByCommit);
  }, [optionsMemo?.selector?.filterByCommit, resources, isLoading, error]);

  // Preserve removed etcd runs (cache), then sort and apply limit
  const runs = React.useMemo((): PipelineRunKind[] => {
    if (!etcdRuns) {
      return etcdRuns;
    }

    let combinedRuns =
      etcdRunsRef.current.length > 0
        ? [...etcdRuns, ...differenceBy(etcdRunsRef.current, etcdRuns, (plr) => plr.metadata?.uid)]
        : etcdRuns;

    combinedRuns.sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );

    if (optionsMemo?.limit && optionsMemo.limit < combinedRuns.length) {
      combinedRuns = combinedRuns.slice(0, optionsMemo.limit);
    }

    return combinedRuns;
  }, [etcdRuns, optionsMemo?.limit]);

  etcdRunsRef.current = runs;

  const processedClusterData = React.useMemo((): PipelineRunKind[] => {
    if (isLoading || error || !Array.isArray(runs)) {
      return [];
    }

    return runs.sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );
  }, [runs, isLoading, error]);

  // Decide when to query external sources (TR or KubeArchive)
  const shouldQueryExternalSources = React.useMemo(() => {
    if (!namespace) {
      return false;
    }

    if (!options?.limit) {
      return true;
    }

    if (processedClusterData.length < options.limit) {
      return true;
    }

    if (error) {
      return true;
    }

    return false;
  }, [namespace, options?.limit, processedClusterData.length, error]);

  const queryTr = !kubearchiveEnabled && shouldQueryExternalSources;

  const [trResources, trLoaded, trError, trGetNextPage, nextPageProps] = useTRPipelineRuns(
    queryTr ? namespace : null,
    optionsMemo,
  );

  // KubeArchive query config when enabled
  const resourceInit = React.useMemo(
    () => ({
      groupVersionKind: PipelineRunGroupVersionKind,
      namespace,
      ...(createKubearchiveWatchResource(namespace, options?.selector) || {}),
      isList: true,
      limit: options?.limit,
    }),
    [namespace, options?.limit, options?.selector],
  );
  const shouldQueryKubearchive = !!(kubearchiveEnabled && shouldQueryExternalSources && namespace);

  const kubearchiveResult = useKubearchiveListResourceQuery(resourceInit, PipelineRunModel, {
    enabled: shouldQueryKubearchive,
  });

  // KubeArchive results with commit filter, sorted and limited
  const kubearchiveData = React.useMemo((): PipelineRunKind[] => {
    if (!shouldQueryKubearchive) return [];

    const pages = kubearchiveResult.data?.pages;
    const archiveData = pages?.flatMap((page) => page) ?? [];
    let data = archiveData as PipelineRunKind[];

    if (optionsMemo?.selector?.filterByCommit) {
      data = data.filter((plr) => getCommitSha(plr) === optionsMemo.selector.filterByCommit);
    }

    const creationTimestamp = (tr?: PipelineRunKind) => tr?.metadata?.creationTimestamp ?? '';
    const sorted = data.sort((a, b) => creationTimestamp(b).localeCompare(creationTimestamp(a)));

    return optionsMemo?.limit && optionsMemo.limit > 0
      ? sorted.slice(0, optionsMemo.limit)
      : sorted;
  }, [
    kubearchiveResult.data?.pages,
    shouldQueryKubearchive,
    optionsMemo?.limit,
    optionsMemo?.selector?.filterByCommit,
  ]);

  // Merge cluster with external source, dedupe by UID, sort, and limit
  const combinedData = React.useMemo((): PipelineRunKind[] => {
    const mergedData = uniqBy(
      [...processedClusterData, ...(shouldQueryKubearchive ? kubearchiveData : trResources || [])],
      (r) => r.metadata?.uid,
    );

    const sortedData = mergedData.sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );

    return optionsMemo?.limit && optionsMemo.limit < sortedData.length
      ? sortedData.slice(0, optionsMemo.limit)
      : sortedData;
  }, [
    shouldQueryKubearchive,
    processedClusterData,
    kubearchiveData,
    trResources,
    optionsMemo?.limit,
  ]);

  const isLoadingCluster = React.useMemo(() => {
    return !!namespace && isLoading;
  }, [namespace, isLoading]);

  const isLoadingKubeArchive = React.useMemo(() => {
    return shouldQueryKubearchive && kubearchiveResult.isLoading;
  }, [shouldQueryKubearchive, kubearchiveResult.isLoading]);

  const isLoadingTektonResults = React.useMemo(() => {
    return !shouldQueryKubearchive && queryTr && !trLoaded;
  }, [shouldQueryKubearchive, queryTr, trLoaded]);

  // Loading coordination: cluster + (archive | TR)
  const isFullyLoaded = React.useMemo(() => {
    if (!namespace) {
      return false;
    }

    if (shouldQueryKubearchive) {
      return !isLoadingCluster && !isLoadingKubeArchive;
    }

    return !isLoadingCluster && !isLoadingTektonResults;
  }, [
    namespace,
    shouldQueryKubearchive,
    isLoadingCluster,
    isLoadingKubeArchive,
    isLoadingTektonResults,
  ]);

  return React.useMemo((): UsePipelineRunsV2Result => {
    if (!namespace) {
      return [[], false, null, undefined, { hasNextPage: false, isFetchingNextPage: false }];
    }

    const hookError = shouldQueryKubearchive ? kubearchiveResult.error || error : trError || error;

    const getNextPage: GetNextPage = shouldQueryKubearchive
      ? kubearchiveResult.hasNextPage
        ? kubearchiveResult.fetchNextPage
        : undefined
      : trGetNextPage;

    const nextPagePropsState: NextPageProps = shouldQueryKubearchive
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
    shouldQueryKubearchive,
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

  const is404Error = clusterResult.isError && has404Error(clusterResult.error);

  const tektonResult = useTRPipelineRuns(
    !kubearchiveEnabled && enabled && is404Error ? namespace : undefined,
    React.useMemo(
      () => ({
        filter: EQ('data.metadata.name', pipelineRunName),
        limit: 1,
      }),
      [pipelineRunName],
    ),
    {
      staleTime: Infinity,
    },
  );

  const kubearchiveResult = useKubearchiveGetResourceQuery(resourceInit, PipelineRunModel, {
    enabled: kubearchiveEnabled && enabled && is404Error,
    staleTime: Infinity,
  });

  return React.useMemo(() => {
    if (!enabled) {
      return [undefined, false, undefined];
    }

    // if we have cluster data without 404 error, return it
    if (clusterResult.data && !is404Error) {
      return [clusterResult.data, !clusterResult.isLoading, clusterResult.error];
    }

    // otherwise, prefer kubearchive/tekton data
    if (kubearchiveEnabled) {
      if (kubearchiveResult.data) {
        return [
          kubearchiveResult.data as PipelineRunKind,
          !kubearchiveResult.isLoading,
          kubearchiveResult.error,
        ];
      }

      const isLoading = clusterResult.isLoading || kubearchiveResult.isLoading;
      return [kubearchiveResult.data as PipelineRunKind, !isLoading, kubearchiveResult.error];
    }

    const [trData, trLoaded, trError] = tektonResult;
    if (trData?.[0]) {
      return [trData[0], trLoaded, trError];
    }

    const isLoading = clusterResult.isLoading || !trLoaded;
    // return tekton error if available, otherwise null
    // (don't return cluster 404 error when tekton-results is still loading)
    const error = trError || null;
    return [undefined, !isLoading, error];
  }, [
    enabled,
    clusterResult.data,
    clusterResult.isLoading,
    clusterResult.error,
    kubearchiveEnabled,
    kubearchiveResult.data,
    kubearchiveResult.isLoading,
    kubearchiveResult.error,
    is404Error,
    tektonResult,
  ]);
};
