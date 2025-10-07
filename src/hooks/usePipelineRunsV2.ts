import * as React from 'react';
import { differenceBy, uniqBy } from 'lodash-es';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import {
  useKubearchiveGetResourceQuery,
  useKubearchiveListResourceQuery,
} from '~/kubearchive/hooks';
import {
  createKubearchiveWatchResource,
  PipelineRunSelector,
} from '~/utils/pipeline-run-filter-transform';
import { EQ } from '~/utils/tekton-results';
import { useK8sWatchResource } from '../k8s';
import { PipelineRunGroupVersionKind, PipelineRunModel } from '../models';
import { useDeepCompareMemoize } from '../shared';
import { PipelineRunKind } from '../types';
import { WatchK8sResource } from '../types/k8s';
import { getCommitSha } from '../utils/commits-utils';
import { GetNextPage, NextPageProps, useTRPipelineRuns } from './useTektonResults';

interface UsePipelineRunsV2Options
  extends Partial<Pick<WatchK8sResource, 'watch' | 'limit' | 'fieldSelector'>> {
  selector?: PipelineRunSelector;
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
    if (!etcdRuns.length) {
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
    if (isLoading || error || !resources || !Array.isArray(resources)) {
      return [];
    }

    return resources.sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );
  }, [resources, isLoading, error]);

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

  // Tekton Results (raw) and mirrored commit filtering
  const [trResourcesRaw, trLoaded, trError, trGetNextPage, nextPageProps] = useTRPipelineRuns(
    queryTr ? namespace : null,
    optionsMemo,
  );

  const trResources = React.useMemo((): PipelineRunKind[] => {
    if (!trResourcesRaw || trResourcesRaw.length === 0) {
      return [];
    }

    if (optionsMemo?.selector?.filterByCommit) {
      return trResourcesRaw.filter(
        (plr) => getCommitSha(plr) === optionsMemo.selector.filterByCommit,
      );
    }

    return trResourcesRaw;
  }, [trResourcesRaw, optionsMemo?.selector?.filterByCommit]);

  // KubeArchive query config when enabled
  const resourceInit = React.useMemo(
    () =>
      kubearchiveEnabled && shouldQueryExternalSources && namespace
        ? {
            groupVersionKind: PipelineRunGroupVersionKind,
            namespace,
            ...(createKubearchiveWatchResource(namespace, options?.selector) || {}),
            isList: true,
            limit: options?.limit || 200,
          }
        : undefined,
    [namespace, options?.limit, options?.selector, kubearchiveEnabled, shouldQueryExternalSources],
  );

  const kubearchiveResult = useKubearchiveListResourceQuery(resourceInit, PipelineRunModel);

  // KubeArchive results with commit filter, sorted and limited
  const kubearchiveData = React.useMemo((): PipelineRunKind[] => {
    if (!kubearchiveEnabled) return [];

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
    kubearchiveEnabled,
    optionsMemo?.limit,
    optionsMemo?.selector?.filterByCommit,
  ]);

  // Merge cluster with external source, dedupe by UID, sort, and limit
  const combinedData = React.useMemo((): PipelineRunKind[] => {
    const mergedData = uniqBy(
      [...processedClusterData, ...(kubearchiveEnabled ? kubearchiveData : trResources || [])],
      (r) => r.metadata?.uid,
    );

    const sortedData = mergedData.sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );

    return optionsMemo?.limit && optionsMemo.limit < sortedData.length
      ? sortedData.slice(0, optionsMemo.limit)
      : sortedData;
  }, [kubearchiveEnabled, processedClusterData, kubearchiveData, trResources, optionsMemo?.limit]);

  const isLoadingCluster = React.useMemo(() => {
    return !!namespace && isLoading;
  }, [namespace, isLoading]);

  const isLoadingKubeArchive = React.useMemo(() => {
    return kubearchiveEnabled && !!namespace && kubearchiveResult.isLoading;
  }, [kubearchiveEnabled, namespace, kubearchiveResult.isLoading]);

  const isLoadingTektonResults = React.useMemo(() => {
    return !kubearchiveEnabled && queryTr && !trLoaded;
  }, [kubearchiveEnabled, queryTr, trLoaded]);

  // Loading coordination: cluster + (archive | TR)
  const isFullyLoaded = React.useMemo(() => {
    if (!namespace) {
      return false;
    }

    if (kubearchiveEnabled) {
      return !isLoadingCluster && !isLoadingKubeArchive;
    }

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
