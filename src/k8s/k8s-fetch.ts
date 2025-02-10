import { AnyObject } from '../types/common';
import { K8sModelCommon, K8sResourceCommon, Patch, QueryOptionsWithSelector } from '../types/k8s';
import { commonFetchJSON } from './fetch';
import { getK8sResourceURL } from './k8s-utils';

export type K8sResourceBaseOptions<TQueryOptions = Partial<QueryOptionsWithSelector>> = {
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
  Pick<Partial<QueryOptionsWithSelector>, 'ns' | 'queryParams' | 'ws'>
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
    items: result.items
      ? result.items.map((i) => ({
          ...i,
          apiVersion: result.apiVersion,
          kind: model.kind,
        }))
      : [],
  }));

export const K8sListResourceItems = <TResource extends K8sResourceCommon>(
  options: K8sResourceListOptions,
): Promise<TResource[]> => k8sListResource<TResource>(options).then((result) => result.items);

export const k8sCreateResource = <
  TResource extends K8sResourceCommon,
  TCreatedResource = TResource,
>({
  model,
  resource,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceUpdateOptions<TResource>): Promise<TCreatedResource> =>
  commonFetchJSON.post<TCreatedResource>(
    getK8sResourceURL(model, resource, queryOptions, true),
    resource,
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );

export const k8sUpdateResource = <
  TResource extends K8sResourceCommon,
  TUpdatedResource extends TResource = TResource,
>({
  model,
  resource,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceUpdateOptions<TResource>): Promise<TUpdatedResource> => {
  if (!resource.metadata?.name) {
    return Promise.reject(new Error('Resource payload name not specified'));
  }

  return commonFetchJSON.put<TUpdatedResource>(
    getK8sResourceURL(model, resource, queryOptions),
    resource,
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );
};

export const k8sPatchResource = <
  TResource extends K8sResourceCommon,
  TPatchedResource extends TResource = TResource,
>({
  model,
  patches,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourcePatchOptions): Promise<TPatchedResource> =>
  commonFetchJSON.patch<TPatchedResource>(
    getK8sResourceURL(model, undefined, queryOptions),
    patches,
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );

export const k8sDeleteResource = <TResource extends K8sResourceCommon, TDeleteResult = TResource>({
  model,
  payload,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceDeleteOptions): Promise<TDeleteResult> => {
  const data: AnyObject = payload ?? {};

  if (!payload && model.propagationPolicy) {
    data.kind = 'DeleteOptions';
    data.apiVersion = 'v1';
    data.propagationPolicy = model.propagationPolicy;
  }

  return commonFetchJSON.delete<TDeleteResult>(
    getK8sResourceURL(model, undefined, queryOptions),
    data,
    fetchOptions.requestInit,
    fetchOptions.timeout,
    true,
  );
};
