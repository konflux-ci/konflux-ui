import { QueryOptions as ReactQueryOptions, UseQueryOptions } from '@tanstack/react-query';
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
}: {
  model: K8sModelCommon;
  queryOptions?: Partial<QueryOptionsWithSelector>;
  prefix?: string;
}) => {
  const idKey = queryOptions?.name ? [{ metadata: { name: queryOptions.name } }] : [];
  const selector = queryOptions?.queryParams?.labelSelector
    ? [queryOptions?.queryParams?.labelSelector]
    : [];
  return [
    ...(prefix ? [prefix] : []),
    queryOptions?.ns,
    {
      group: model?.apiGroup ?? 'core',
      version: model?.apiVersion,
      kind: model?.kind,
    },
    ...idKey,
    ...selector,
  ];
};

export const createGetQueryOptions = <TResource extends K8sResourceCommon>(
  args: K8sResourceBaseOptions,
  options: Omit<ReactQueryOptions<TResource>, 'queryKey' | 'queryFn'> = {},
): UseQueryOptions<TResource> => {
  return {
    queryKey: createQueryKeys({ ...args, prefix: args.fetchOptions?.requestInit?.pathPrefix }),
    queryFn: () => {
      return K8sGetResource(args);
    },
    initialData: () => {
      const name = args.queryOptions?.name;
      return name
        ? queryClient
            .getQueryData<
              TResource[]
            >(createQueryKeys({ model: args.model, queryOptions: { queryParams: args.queryOptions?.queryParams } }))
            ?.find((res) => res.metadata.name === name)
        : null;
    },
    ...options,
  };
};

export const createListqueryOptions = <TResource extends K8sResourceCommon[]>(
  args: K8sResourceListOptions,
  { filterData = (a: TResource) => a, ...options }: TQueryOptions<TResource> = {},
): UseQueryOptions<TResource> => {
  return {
    queryKey: createQueryKeys({ ...args, prefix: args.fetchOptions?.requestInit?.pathPrefix }),
    queryFn: () => {
      return K8sListResourceItems(args).then(filterData);
    },
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
