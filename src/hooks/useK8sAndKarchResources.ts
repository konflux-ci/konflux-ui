import * as React from 'react';
import { hashKey } from '@tanstack/query-core';
import { useK8sQueryWatch } from '~/k8s/hooks/useK8sQueryWatch';
import { WebSocketOptions } from '~/k8s/web-socket/types';
import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';
import { createQueryKeys, useK8sWatchResource } from '../k8s';
import { K8sResourceReadOptions } from '../k8s/k8s-fetch';
import { TQueryOptions } from '../k8s/query/type';
import { useKubearchiveListResourceQuery } from '../kubearchive/hooks';
import {
  K8sModelCommon,
  K8sResourceCommon,
  ResourceSource,
  ResourceWithSource,
  WatchK8sResource,
} from '../types/k8s';

export interface K8sAndKarchResourcesResult<T extends K8sResourceCommon> {
  // Combined data (cluster + archive, deduplicated)
  data: T[];

  // Separate loading states
  clusterLoading: boolean;
  archiveLoading: boolean;
  isLoading: boolean; // true if either is loading

  // Separate error states
  clusterError: unknown;
  archiveError: unknown;
  hasError: boolean; // true if either has error

  // Archive-specific infinite query utilities
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;

  // Raw data for advanced use cases
  clusterData: T[] | undefined;
  archiveData: T[][] | undefined;
}

/**
 * Hook that fetches list resources from both the cluster (using useK8sWatchResource)
 * and KubeArchive, combines them into a single deduplicated array.
 *
 */
export function useK8sAndKarchResources<T extends K8sResourceCommon>(
  resourceInit: WatchK8sResource | undefined,
  model: K8sModelCommon,
  queryOptions?: TQueryOptions<T[]>,
  options?: Partial<RequestInit & { wsPrefix?: string; pathPrefix?: string }>,
): K8sAndKarchResourcesResult<T> {
  const listResourceInit = React.useMemo(() => {
    if (!resourceInit) return undefined;
    return {
      ...resourceInit,
      isList: true,
    };
  }, [resourceInit]);

  const clusterQuery = useK8sWatchResource<T[]>(listResourceInit, model, queryOptions, options);

  const archiveQuery = useKubearchiveListResourceQuery(listResourceInit, model);

  // deduplicated data
  const combinedData = React.useMemo(() => {
    const clusterData = clusterQuery.data || [];
    const archivePages = archiveQuery.data?.pages || [];
    const archiveData = archivePages.flat();

    const combined = [...clusterData];
    const existingIds = new Set(
      clusterData.map(
        (item) => item.metadata?.uid || `${item.metadata?.name}-${item.metadata?.namespace}`,
      ),
    );

    archiveData.forEach((item) => {
      const id = item.metadata?.uid || `${item.metadata?.name}-${item.metadata?.namespace}`;
      if (!existingIds.has(id)) {
        combined.push(item as T);
        existingIds.add(id);
      }
    });

    return combined;
  }, [clusterQuery.data, archiveQuery.data?.pages]);

  return React.useMemo(() => {
    const clusterLoading = clusterQuery.isLoading;
    const archiveLoading = archiveQuery.isLoading;
    const clusterError = clusterQuery.error;
    const archiveError = archiveQuery.error;

    return {
      // Combined data
      data: combinedData,

      // Separate loading states
      clusterLoading,
      archiveLoading,
      isLoading: clusterLoading || archiveLoading,

      // Separate error states
      clusterError,
      archiveError,
      hasError: !!clusterError || !!archiveError,

      // Archive infinite query utilities
      hasNextPage: archiveQuery.hasNextPage,
      isFetchingNextPage: archiveQuery.isFetchingNextPage,
      fetchNextPage: archiveQuery.fetchNextPage,

      // Raw data for advanced use cases
      clusterData: clusterQuery.data,
      archiveData: archiveQuery.data?.pages as T[][] | undefined,
    };
  }, [
    combinedData,
    clusterQuery.isLoading,
    clusterQuery.error,
    clusterQuery.data,
    archiveQuery.isLoading,
    archiveQuery.error,
    archiveQuery.data?.pages,
    archiveQuery.hasNextPage,
    archiveQuery.isFetchingNextPage,
    archiveQuery.fetchNextPage,
  ]);
}

export interface useK8sAndKarchResourceResult<TResource extends K8sResourceCommon> {
  data: TResource | undefined;
  source: ResourceSource | undefined;
  isLoading: boolean;
  fetchError: unknown;
  wsError: unknown;
  isError: boolean;
}

/**
 * Hook to fetch a single K8s resource with fallback logic.
 * First tries to fetch from the cluster, if it returns 404, falls back to kubearchive.
 * Uses the tanstack query integrated functions directly.
 *
 * @param resourceInit - K8s resource read options
 * @param queryOptions - Optional query options
 * @param watch - Whether to watch the resource (default: false)
 * @param watchOptions - Optional watch options
 * @param enabled - Whether the query should be enabled (default: true)
 * @returns Object with data, loading, and error states
 */
export function useK8sAndKarchResource<TResource extends K8sResourceCommon>(
  resourceInit: K8sResourceReadOptions | null,
  queryOptions?: TQueryOptions<TResource>,
  watch: boolean = false,
  watchOptions: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  > = {},
  enabled: boolean = true,
): useK8sAndKarchResourceResult<TResource> {
  const [result, setResult] = React.useState<ResourceWithSource<TResource> | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [fetchError, setFetchError] = React.useState<unknown>(null);

  React.useEffect(() => {
    if (!enabled || !resourceInit) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    fetchResourceWithK8sAndKubeArchive<TResource>(resourceInit, queryOptions)
      .then((res) => {
        setResult(res);
        setFetchError(null);
      })
      .catch((err) => {
        setFetchError(err);
        setResult(undefined);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [resourceInit, enabled, queryOptions]);

  const shouldWatch = enabled && watch && result?.source === ResourceSource.Cluster && resourceInit;

  const wsError = useK8sQueryWatch(
    shouldWatch ? resourceInit : null,
    false,
    shouldWatch
      ? hashKey(
          createQueryKeys({
            model: resourceInit.model,
            queryOptions: resourceInit.queryOptions,
            prefix: watchOptions?.pathPrefix ?? resourceInit.fetchOptions?.requestInit?.pathPrefix,
          }),
        )
      : hashKey(['disabled', 'no-resource']),
    watchOptions,
  );

  return {
    data: result?.resource,
    source: result?.source,
    isLoading,
    fetchError,
    wsError,
    isError: !!(fetchError || wsError),
  };
}
