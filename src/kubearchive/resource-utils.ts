import { k8sQueryGetResource } from '~/k8s';
import { HttpError } from '~/k8s/error';
import { K8sResourceReadOptions } from '~/k8s/k8s-fetch';
import { TQueryOptions } from '~/k8s/query/type';
import { K8sResourceCommon } from '~/types/k8s';
import { kubearchiveQueryGetResource } from './fetch-utils';

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
    if (error instanceof HttpError && error.code === 404) {
      try {
        return await kubearchiveQueryGetResource<TResource>(resourceInit, options);
      } catch (archiveError) {
        throw error;
      }
    }

    throw error;
  }
}
