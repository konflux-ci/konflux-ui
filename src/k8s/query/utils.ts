import { UseQueryOptions, queryOptions as _createQueryOptions } from '@tanstack/react-query';
import { isPlainObject } from 'lodash-es';
import { K8sModelCommon, K8sResourceCommon, QueryOptions } from '../../types/k8s';
import {
  K8sResourceBaseOptions,
  K8sGetResource,
  K8sResourceListOptions,
  K8sListResourceItems,
} from '../k8s-fetch';
import { TQueryOptions } from './type';

export const createQueryKeys = ({
  model,
  queryOptions,
}: {
  model: K8sModelCommon;
  queryOptions: QueryOptions;
}) => {
  const idKey = queryOptions?.name ? [{ metadata: { name: queryOptions.name } }] : [];
  return [
    queryOptions?.ws,
    {
      group: model?.apiGroup ?? 'core',
      version: model?.apiVersion,
      kind: model?.kind,
    },
    ...idKey,
  ];
};

export const createGetQueryOptions = <TResource extends K8sResourceCommon>(
  args: K8sResourceBaseOptions,
  options: Omit<TQueryOptions<TResource>, 'filterData'>,
): UseQueryOptions<TResource> => {
  return _createQueryOptions({
    queryKey: createQueryKeys({ model: args.model, queryOptions: args.queryOptions }),
    queryFn: () => {
      return K8sGetResource(args);
    },
    ...options,
  });
};

export const createListqueryOptions = <TResource extends K8sResourceCommon[]>(
  args: K8sResourceListOptions,
  { filterData = (a: TResource) => a, ...options }: TQueryOptions<TResource> = {},
): UseQueryOptions<TResource> => {
  return _createQueryOptions({
    queryKey: createQueryKeys({ model: args.model, queryOptions: args.queryOptions }),
    queryFn: () => {
      return K8sListResourceItems(args).then(filterData);
    },
    ...(options ?? {}),
  });
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
