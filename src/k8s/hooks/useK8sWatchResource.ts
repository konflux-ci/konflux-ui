import {
  hashKey,
  QueryOptions as ReactQueryOptions,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import { K8sModelCommon, K8sResourceCommon, WatchK8sResource } from '../../types/k8s';
import { convertToK8sQueryParams } from '../k8s-utils';
import { TQueryOptions } from '../query/type';
import { createGetQueryOptions, createListqueryOptions, createQueryKeys } from '../query/utils';
import { WebSocketOptions } from '../web-socket/types';
import { useK8sQueryWatch } from './useK8sQueryWatch';

export const useK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  resourceInit: WatchK8sResource,
  model: K8sModelCommon,
  queryOptions?: TQueryOptions<R>,
  options: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  > = {},
): UseQueryResult<R> => {
  const k8sQueryOptions = convertToK8sQueryParams(resourceInit);

  useK8sQueryWatch(
    resourceInit.watch ? { model, queryOptions: k8sQueryOptions } : null,
    resourceInit.isList,
    hashKey(createQueryKeys({ model, queryOptions: k8sQueryOptions })),
    options,
  );

  const queryOptionsTyped = resourceInit.isList
    ? queryOptions
    : (queryOptions as Omit<ReactQueryOptions<R>, 'queryKey' | 'queryFn'>);

  return useQuery(
    resourceInit.isList
      ? createListqueryOptions<R>(
          { model, queryOptions: k8sQueryOptions, fetchOptions: options },
          queryOptionsTyped,
        )
      : createGetQueryOptions<R>(
          { model, queryOptions: k8sQueryOptions, fetchOptions: options },
          queryOptionsTyped,
        ),
  );
};
