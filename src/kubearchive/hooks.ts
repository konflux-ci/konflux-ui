import {
  useInfiniteQuery,
  useQuery,
  UseInfiniteQueryResult,
  UseQueryResult,
  InfiniteData,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  k8sListResource,
  convertToK8sQueryParams,
  createQueryKeys,
  createGetQueryOptions,
  K8sResourceListOptions,
} from '~/k8s';
import { TQueryOptions } from '../k8s/query/type';
import { K8sModelCommon, K8sResourceCommon, WatchK8sResource } from '../types/k8s';
import { useIsKubeArchiveEnabled } from './conditional-checks';
import { KUBEARCHIVE_PATH_PREFIX } from './const';
import { withKubearchivePathPrefix } from './fetch-utils';

/**
 * Hook for fetching paginated list resources from KubeArchive with infinite query support.
 *
 * This hook provides React Query's infinite query functionality for archive data, allowing
 * you to load resources in pages using Kubernetes-native continue tokens. The hook automatically
 * handles pagination state and provides utilities for loading additional pages.
 *
 * @param resourceInit - K8s resource watch configuration (namespace, selector, etc.)
 * @param model - K8s model definition containing API group, version, and kind information
 * @returns UseInfiniteQueryResult<InfiniteData<K8sResourceCommon[], unknown>, unknown>
 */
export function useKubearchiveListResourceQuery(
  resourceInit: WatchK8sResource,
  model: K8sModelCommon,
): UseInfiniteQueryResult<InfiniteData<K8sResourceCommon[], unknown>, unknown> {
  const k8sQueryOptions = convertToK8sQueryParams(resourceInit);
  const queryKey = createQueryKeys({ model, queryOptions: k8sQueryOptions, prefix: 'kubearchive' });
  const { isKubearchiveEnabled } = useIsKubeArchiveEnabled();
  return useInfiniteQuery<K8sResourceCommon[]>({
    enabled: isKubearchiveEnabled,
    queryKey,
    queryFn: async ({ pageParam = undefined }) => {
      const pagedOptions = {
        model,
        queryOptions: {
          ...k8sQueryOptions,
          queryParams: {
            ...k8sQueryOptions.queryParams,
            continue: pageParam as string | undefined,
          },
        },
      };
      const fullRes = await k8sListResource<K8sResourceCommon>(
        withKubearchivePathPrefix<K8sResourceListOptions>(pagedOptions),
      );
      // Attach the continue token to the result via a custom property
      Object.defineProperty(fullRes.items, '_continue', {
        value: fullRes.metadata?.continue,
        enumerable: false,
      });
      return fullRes.items;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: K8sResourceCommon[] & { _continue?: string }) =>
      lastPage?._continue || undefined,
  });
}

/**
 * Hook for fetching a single resource from KubeArchive.
 *
 * This hook fetches a specific resource by name from the KubeArchive, providing
 * standard React Query functionality with loading states, error handling, and caching.
 * Unlike the list hook, this is designed for fetching individual resources when you
 * know the exact name and namespace.
 *
 * @param resourceInit - K8s resource watch configuration specifying the resource to fetch
 * @param model - K8s model definition containing API group, version, and kind information
 * @param queryOptions - Optional React Query options for customizing query behavior
 * @param options - Optional request configuration (headers, timeout, etc.)
 * @returns UseQueryResult<K8sResourceCommon, unknown>
 */
export function useKubearchiveGetResourceQuery(
  resourceInit: WatchK8sResource,
  model: K8sModelCommon,
  queryOptions?: TQueryOptions<K8sResourceCommon>,
  options: Partial<RequestInit & { wsPrefix?: string; pathPrefix?: string }> = {},
): UseQueryResult<K8sResourceCommon, unknown> {
  const k8sQueryOptions = convertToK8sQueryParams(resourceInit);
  const baseOptions = { requestInit: { ...options, pathPrefix: KUBEARCHIVE_PATH_PREFIX } };
  const { isKubearchiveEnabled } = useIsKubeArchiveEnabled();
  return useQuery<K8sResourceCommon>(
    createGetQueryOptions<K8sResourceCommon>(
      {
        model,
        queryOptions: k8sQueryOptions,
        fetchOptions: baseOptions,
      },
      {
        ...queryOptions,
        enabled: isKubearchiveEnabled && queryOptions?.enabled,
      } as UseQueryOptions<K8sResourceCommon>,
    ),
  );
}
