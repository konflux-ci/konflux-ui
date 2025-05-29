import { HttpError } from '~/k8s/error';
import {
  K8sResourceListOptions,
  K8sResourceReadOptions,
  K8sResourceListResult,
  createGetQueryOptions,
  queryClient,
  createListqueryOptions,
  createQueryKeys,
  k8sListResource,
  k8sQueryGetResource,
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

/**
 * Utility function to fetch a single K8s resource with fallback logic.
 * First tries to fetch from the cluster, if it returns 404, falls back to kubearchive.
 *
 * @param resourceInit - K8s resource read options
 * @param options - Optional query options
 * @returns Promise<TResource> - The fetched resource
 * @throws Error if resource is not found in both cluster and kubearchive or other errors occur
 */
export async function fetchResourceWithK8sAndKubeArchive<TResource extends K8sResourceCommon>(
  resourceInit: K8sResourceReadOptions,
  options?: TQueryOptions<TResource>,
): Promise<TResource> {
  try {
    return await k8sQueryGetResource<TResource>(resourceInit, options);
  } catch (error) {
    if (error instanceof HttpError && error.response?.status === 404) {
      try {
        return await kubearchiveQueryGetResource<TResource>(resourceInit, options);
      } catch (archiveError) {
        throw error;
      }
    }

    throw error;
  }
}

export { withKubearchivePathPrefix };
