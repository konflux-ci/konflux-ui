import { k8sQueryGetResource } from '~/k8s';
import { HttpError } from '~/k8s/error';
import { K8sResourceReadOptions } from '~/k8s/k8s-fetch';
import { TQueryOptions } from '~/k8s/query/type';
import { K8sResourceCommon, ResourceSource, ResourceWithSource } from '~/types/k8s';
import { isKubeArchiveEnabled } from './conditional-checks';
import { kubearchiveQueryGetResource } from './fetch-utils';

/**
 * Fetches a single Kubernetes resource with intelligent fallback from cluster to archive.
 *
 * This utility implements a two-tier fallback strategy for resource fetching:
 * 1. First attempts to fetch from the live cluster using k8sQueryGetResource
 * 2. If cluster returns 404 (Not Found), falls back to KubeArchive
 * 3. If both sources fail, throws the original cluster error
 *
 * @template TResource - The type of Kubernetes resource to fetch
 * @param {K8sResourceReadOptions} resourceInit - Resource identification and query parameters
 * @param {TQueryOptions<TResource>} [options] - Optional React Query configuration
 * @returns {Promise<TResource>} Promise resolving to the fetched resource from cluster or archive
 * @throws {Error} Original cluster error if resource not found in both sources, or any non-404 cluster error
 */
export async function fetchResourceWithK8sAndKubeArchive<TResource extends K8sResourceCommon>(
  resourceInit: K8sResourceReadOptions,
  options?: TQueryOptions<TResource>,
): Promise<ResourceWithSource<TResource>> {
  const isEnabled = isKubeArchiveEnabled();
  try {
    return {
      resource: await k8sQueryGetResource<TResource>(resourceInit, options),
      source: ResourceSource.Cluster,
    };
  } catch (error) {
    if (error instanceof HttpError && error.code === 404 && isEnabled) {
      try {
        return {
          resource: await kubearchiveQueryGetResource<TResource>(resourceInit, options),
          source: ResourceSource.Archive,
        };
      } catch (archiveError) {
        throw error;
      }
    }

    throw error;
  }
}
