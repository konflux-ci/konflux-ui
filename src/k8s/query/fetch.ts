import { K8sResourceCommon } from '../../types/k8s';
import {
  k8sCreateResource,
  k8sDeleteResource,
  k8sPatchResource,
  K8sResourceDeleteOptions,
  K8sResourceListOptions,
  K8sResourcePatchOptions,
  K8sResourceReadOptions,
  K8sResourceUpdateOptions,
  k8sUpdateResource,
} from '../k8s-fetch';
import { queryClient } from './core';
import { TQueryOptions } from './type';
import { createGetQueryOptions, createListqueryOptions, createQueryKeys } from './utils';

export const k8sQueryGetResource = <TResource extends K8sResourceCommon>(
  resourceInit: K8sResourceReadOptions,
  options: TQueryOptions<TResource>,
): Promise<TResource> =>
  queryClient.ensureQueryData<TResource>(createGetQueryOptions<TResource>(resourceInit, options));

export const K8sQueryListResourceItems = <TResource extends K8sResourceCommon[]>(
  resourceInit: K8sResourceListOptions,
  options: TQueryOptions<TResource>,
): Promise<TResource> =>
  queryClient.ensureQueryData(createListqueryOptions<TResource>(resourceInit, options));

export const K8sQueryUpdateResource = <TResource extends K8sResourceCommon>(
  requestInit: K8sResourceUpdateOptions<TResource>,
) => {
  return k8sUpdateResource(requestInit).finally(() => {
    !requestInit.queryOptions?.queryParams?.dryRun &&
      void queryClient.invalidateQueries({
        queryKey: createQueryKeys({
          model: requestInit.model,
          queryOptions: { ws: requestInit.queryOptions.ws, ns: requestInit.queryOptions.ns },
        }),
      });
  });
};

export const K8sQueryPatchResource = (requestInit: K8sResourcePatchOptions) => {
  return k8sPatchResource(requestInit).finally(() => {
    !requestInit.queryOptions?.queryParams?.dryRun &&
      void queryClient.invalidateQueries({
        queryKey: createQueryKeys({
          model: requestInit.model,
          queryOptions: { ws: requestInit.queryOptions.ws, ns: requestInit.queryOptions.ns },
        }),
      });
  });
};

export const K8sQueryCreateResource = <TResource extends K8sResourceCommon>(
  requestInit: K8sResourceUpdateOptions<TResource>,
) => {
  return k8sCreateResource(requestInit).finally(() => {
    !requestInit.queryOptions?.queryParams?.dryRun &&
      void queryClient.invalidateQueries({
        queryKey: createQueryKeys({
          model: requestInit.model,
          queryOptions: { ws: requestInit.queryOptions.ws, ns: requestInit.queryOptions.ns },
        }),
      });
  });
};

export const K8sQueryDeleteResource = <TResource extends K8sResourceCommon>(
  requestInit: K8sResourceDeleteOptions,
) => {
  return k8sDeleteResource<TResource>(requestInit).finally(() => {
    !requestInit.queryOptions?.queryParams?.dryRun &&
      void queryClient.invalidateQueries({
        queryKey: createQueryKeys({
          model: requestInit.model,
          queryOptions: { ws: requestInit.queryOptions.ws, ns: requestInit.queryOptions.ns },
        }),
      });
  });
};
