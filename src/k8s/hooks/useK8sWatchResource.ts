import {
  hashKey,
  QueryOptions as ReactQueryOptions,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { K8sModelCommon, K8sResourceCommon, WatchK8sResource } from '../../types/k8s';
import { convertToK8sQueryParams } from '../k8s-utils';
import { TQueryOptions } from '../query/type';
import { createGetQueryOptions, createListqueryOptions, createQueryKeys } from '../query/utils';
import { WebSocketOptions } from '../web-socket/types';
import { useK8sQueryWatch } from './useK8sQueryWatch';

const POLLING_INTERVAL = 10000;

export type K8sWatchResult<R> = UseQueryResult<R> & {
  /** True when the WebSocket connection degraded to polling after max retries. */
  isWatchDegraded: boolean;
};

export const useK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  resourceInit: WatchK8sResource,
  model: K8sModelCommon,
  queryOptions?: TQueryOptions<R>,
  options: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  > = {},
): K8sWatchResult<R> => {
  const k8sQueryOptions = convertToK8sQueryParams(resourceInit);
  const wsError = useK8sQueryWatch(
    resourceInit?.watch ? { model, queryOptions: k8sQueryOptions } : null,
    resourceInit?.isList,
    hashKey(createQueryKeys({ model, queryOptions: k8sQueryOptions })),
    options,
  );
  // [TODO]: add better typing for the query options
  const getQueryOptions = (): UseQueryOptions<R> => {
    const queryOptionsTyped = resourceInit?.isList
      ? queryOptions
      : (queryOptions as Omit<ReactQueryOptions<R>, 'queryKey' | 'queryFn'>);
    const baseQueryOptions = {
      enabled: !!resourceInit,
      refetchInterval: wsError ? POLLING_INTERVAL : undefined,
      ...queryOptionsTyped,
    };
    return (
      resourceInit?.isList
        ? createListqueryOptions(
            { model, queryOptions: k8sQueryOptions, fetchOptions: options },
            baseQueryOptions as TQueryOptions<K8sResourceCommon[]>,
          )
        : createGetQueryOptions(
            { model, queryOptions: k8sQueryOptions, fetchOptions: options },
            baseQueryOptions as Omit<ReactQueryOptions<K8sResourceCommon>, 'queryKey' | 'queryFn'>,
          )
    ) as UseQueryOptions<R>;
  };

  const query = useQuery<R>(getQueryOptions());
  // Object.assign only triggers the query result's Proxy `set` trap for the new key,
  // unlike a spread which triggers `get` on every property and defeats TanStack Query's
  // tracked-properties render optimization for this widely-shared hook.
  return Object.assign(query, { isWatchDegraded: wsError !== null }) as K8sWatchResult<R>;
};
