import { AnyObject } from '../types/common';
import { K8sModelCommon, K8sResourceCommon, Patch, QueryOptions } from '../types/k8s';
import { commonFetchJSON } from './fetch';
import { getK8sResourceURL } from './k8s-utils';

export type K8sResourceBaseOptions<TQueryOptions = Partial<QueryOptions>> = {
  model: K8sModelCommon;
  queryOptions?: TQueryOptions;
  fetchOptions?: Partial<{
    requestInit: RequestInit & { wsPrefix?: string; pathPrefix?: string };
    timeout: number;
  }>;
};

export type K8sResourceReadOptions = K8sResourceBaseOptions;

export type K8sResourceUpdateOptions<TResource extends K8sResourceCommon> =
  K8sResourceBaseOptions & {
    resource: TResource;
  };

export type K8sResourcePatchOptions = K8sResourceBaseOptions & {
  patches: Patch[];
};

export type K8sResourceDeleteOptions = K8sResourceBaseOptions & {
  payload?: AnyObject;
};

export type K8sResourceListOptions = K8sResourceBaseOptions<
  Pick<Partial<QueryOptions>, 'ns' | 'queryParams' | 'ws'>
>;

export type K8sResourceListResult<TResource extends K8sResourceCommon> = {
  apiVersion: string;
  items: TResource[];
  metadata: {
    resourceVersion: string;
    continue: string;
  };
};

export type ResourcePromiseFunction = <TResource>(
  args: K8sResourceBaseOptions,
) => Promise<TResource>;

export const K8sGetResource = <TResource extends K8sResourceCommon>({
  model,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceReadOptions): Promise<TResource> => {
  return commonFetchJSON<TResource>(
    getK8sResourceURL(model, undefined, queryOptions),
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );
};

export const k8sListResource = <TResource extends K8sResourceCommon>({
  model,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceListOptions): Promise<K8sResourceListResult<TResource>> =>
  commonFetchJSON<K8sResourceListResult<TResource>>(
    getK8sResourceURL(model, undefined, {
      ns: queryOptions.ns,
      ws: queryOptions.ws,
      queryParams: queryOptions.queryParams,
    }),
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  ).then((result) => ({
    ...result,
    items: result.items.map((i) => ({
      ...i,
      apiVersion: result.apiVersion,
      kind: model.kind,
    })),
  }));

export const K8sListResourceItems = <TResource extends K8sResourceCommon>(
  options: K8sResourceListOptions,
): Promise<TResource[]> => k8sListResource<TResource>(options).then((result) => result.items);
