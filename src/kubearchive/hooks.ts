import {
  useInfiniteQuery,
  useQuery,
  UseInfiniteQueryResult,
  UseQueryResult,
  InfiniteData,
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
import { withKubearchivePathPrefix } from './fetch-utils';

export function useKubearchiveListResourceQuery(
  resourceInit: WatchK8sResource,
  model: K8sModelCommon,
): UseInfiniteQueryResult<InfiniteData<K8sResourceCommon[], unknown>, unknown> {
  const k8sQueryOptions = convertToK8sQueryParams(resourceInit);
  const queryKey = createQueryKeys({ model, queryOptions: k8sQueryOptions, prefix: 'kubearchive' });

  return useInfiniteQuery<K8sResourceCommon[]>({
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

export function useKubearchiveGetResourceQuery(
  resourceInit: WatchK8sResource,
  model: K8sModelCommon,
  queryOptions?: TQueryOptions<K8sResourceCommon>,
  options: Partial<RequestInit & { wsPrefix?: string; pathPrefix?: string }> = {},
): UseQueryResult<K8sResourceCommon, unknown> {
  const k8sQueryOptions = convertToK8sQueryParams(resourceInit);
  const baseOptions = { requestInit: { ...options, pathPrefix: 'plugins/kubearchive' } };

  return useQuery<K8sResourceCommon>(
    createGetQueryOptions<K8sResourceCommon>(
      {
        model,
        queryOptions: k8sQueryOptions,
        fetchOptions: baseOptions,
      },
      queryOptions,
    ),
  );
}
