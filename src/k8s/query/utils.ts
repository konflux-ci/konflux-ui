import { UseQueryOptions } from '@tanstack/react-query';
import { isPlainObject } from 'lodash-es';
import { K8sModelCommon, K8sResourceCommon, QueryOptionsWithSelector } from '../../types/k8s';
import {
  K8sResourceBaseOptions,
  K8sGetResource,
  K8sResourceListOptions,
  K8sListResourceItems,
} from '../k8s-fetch';
import { queryClient } from './core';
import { TQueryOptions } from './type';

export const createQueryKeys = ({
  model,
  queryOptions,
  prefix,
  fetchOptions,
}: {
  model: K8sModelCommon;
  queryOptions?: Partial<QueryOptionsWithSelector>;
  prefix?: string;
  fetchOptions?: K8sResourceBaseOptions['fetchOptions'];
}) => {
  const pathPrefix = prefix ?? fetchOptions?.requestInit?.pathPrefix;
  const pathSuffix = fetchOptions?.requestInit?.pathSuffix;
  const idKey = queryOptions?.name ? [{ metadata: { name: queryOptions.name } }] : [];
  const selector = queryOptions?.queryParams?.labelSelector
    ? [queryOptions?.queryParams?.labelSelector]
    : [];
  const qp = queryOptions?.queryParams;
  const filterParams =
    qp?.name !== undefined || qp?.creationTimestampAfter !== undefined
      ? [{ name: qp?.name, creationTimestampAfter: qp?.creationTimestampAfter }]
      : [];
  return [
    ...(pathPrefix ? [pathPrefix] : []),
    queryOptions?.ns,
    {
      group: model?.apiGroup ?? 'core',
      version: model?.apiVersion,
      kind: model?.kind,
    },
    ...idKey,
    ...(pathSuffix ? [pathSuffix] : []),
    ...selector,
    ...filterParams,
  ];
};

export const createGetQueryOptions = <TResource extends K8sResourceCommon>(
  args: K8sResourceBaseOptions,
  options: Omit<TQueryOptions<TResource>, 'filterData'> = {},
): UseQueryOptions<TResource> => {
  const { queryKey, queryFn, ...rest } = options;
  return {
    queryKey:
      queryKey ?? createQueryKeys({ ...args, prefix: args.fetchOptions?.requestInit?.pathPrefix }),
    queryFn:
      queryFn ??
      (() => {
        return K8sGetResource(args);
      }),
    initialData: () => {
      const name = args.queryOptions?.name;
      return name
        ? queryClient
            .getQueryData<TResource[]>(
              createQueryKeys({
                model: args.model,
                queryOptions: { queryParams: args.queryOptions?.queryParams },
              }),
            )
            ?.find((res) => res.metadata.name === name)
        : null;
    },
    ...rest,
  };
};

/**
 * Build query options for a K8s list resource fetch.
 *
 * **Note:** when a custom `queryFn` is supplied it takes full ownership of
 * the data pipeline, so `filterData` is not applied.  Callers that need
 * both should compose `filterData` inside their own `queryFn`.
 */
export const createListqueryOptions = <TResource extends K8sResourceCommon[]>(
  args: K8sResourceListOptions,
  {
    filterData = (a: TResource) => a,
    queryKey,
    queryFn,
    ...options
  }: TQueryOptions<TResource> = {},
): UseQueryOptions<TResource> => {
  return {
    queryKey:
      queryKey ?? createQueryKeys({ ...args, prefix: args.fetchOptions?.requestInit?.pathPrefix }),
    queryFn:
      queryFn ??
      (() => {
        return K8sListResourceItems(args).then(filterData);
      }),
    ...options,
  };
};

export const hashQueryKeys = (key: ReadonlyArray<unknown>): string => {
  return JSON.stringify(key, (_, val) =>
    isPlainObject(val)
      ? Object.keys(val as object)
          .sort()
          .reduce(
            (result, k) => {
              result[k] = val[k];
              return result;
            },
            {} as { [key: string]: unknown },
          )
      : val,
  );
};
