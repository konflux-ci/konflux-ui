import { QueryFunctionContext, queryOptions as _createQueryOptions } from '@tanstack/react-query';
import {
  getResource,
  listResourceItems,
  K8sResourceBaseOptions,
  ResourcePromiseFunction,
} from '../k8s-fetch';
import { CreateQueryOptionsArgs, TQueryOptions } from './type';
import { isPlainObject } from 'lodash-es';

export const createQueryKeys = ([
  { model, queryOptions },
  groupVersionKind,
]: CreateQueryOptionsArgs) => {
  const idKey = queryOptions?.name ? [{ metadata: { name: queryOptions.name } }] : [];
  return [
    queryOptions?.ws,
    {
      group: model?.apiGroup ?? groupVersionKind?.group ?? 'core',
      version: model?.apiVersion ?? groupVersionKind?.version,
      kind: model?.kind ?? groupVersionKind?.kind,
    },
    ...idKey,
  ];
};

export const createQueryFunction =
  (isList: boolean) => (args: K8sResourceBaseOptions) => (_: QueryFunctionContext) => {
    return (isList ? listResourceItems : getResource)(args);
  };

export const createQueryOptions =
  <TResource>(fetchFn: ResourcePromiseFunction<TResource>) =>
  (
    args: CreateQueryOptionsArgs,
    { filterData = (a) => a, ...options }: TQueryOptions<TResource> = {},
  ) => {
    return _createQueryOptions({
      queryKey: createQueryKeys(args),
      queryFn: async (): Promise<TResource> => {
        return fetchFn(args[0]).then(filterData);
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
