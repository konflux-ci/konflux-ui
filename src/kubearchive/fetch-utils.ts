import {
  K8sResourceListOptions,
  K8sResourceReadOptions,
  K8sResourceListResult,
  createGetQueryOptions,
  queryClient,
  createListqueryOptions,
  createQueryKeys,
  k8sListResource,
} from '../k8s';
import { TQueryOptions } from '../k8s/query/type';
import { K8sResourceCommon } from '../types/k8s';

function withKubearchivePathPrefix<
  T extends {
    fetchOptions?: { requestInit?: RequestInit & { wsPrefix?: string; pathPrefix?: string } };
  },
>(opts: T): T {
  return {
    ...opts,
    fetchOptions: {
      ...opts.fetchOptions,
      requestInit: {
        ...opts.fetchOptions?.requestInit,
        pathPrefix: 'plugins/kubearchive',
      },
    },
  };
}

export function kubearchiveQueryGetResource<TResource extends K8sResourceCommon>(
  resourceInit: K8sResourceReadOptions,
  options?: TQueryOptions<TResource>,
): Promise<TResource> {
  return queryClient.ensureQueryData<TResource>(
    createGetQueryOptions<TResource>(withKubearchivePathPrefix(resourceInit), options),
  );
}

export function kubearchiveQueryListResourceItems<TResource extends K8sResourceCommon[]>(
  resourceInit: K8sResourceListOptions,
  options?: TQueryOptions<TResource>,
): Promise<TResource> {
  return queryClient.ensureQueryData<TResource>(
    createListqueryOptions<TResource>(withKubearchivePathPrefix(resourceInit), options),
  );
}

export function kubearchiveQueryListResource<TResource extends K8sResourceCommon>(
  resourceInit: K8sResourceListOptions,
  options?: TQueryOptions<K8sResourceListResult<TResource>>,
): Promise<K8sResourceListResult<TResource>> {
  return queryClient.ensureQueryData({
    queryKey: createQueryKeys(withKubearchivePathPrefix(resourceInit)),
    queryFn: () => k8sListResource(withKubearchivePathPrefix(resourceInit)),
    ...options,
  });
}

export { withKubearchivePathPrefix };
