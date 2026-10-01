import React from 'react';
import {
  hashKey,
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

export const useK8sWatchResource = <
  R extends K8sResourceCommon | K8sResourceCommon[],
  TQueryFnData = R,
>(
  resourceInit: WatchK8sResource,
  model: K8sModelCommon,
  queryOptions?: TQueryOptions<R, TQueryFnData>,
  options: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  > = {},
): UseQueryResult<R> & { wsError: unknown } => {
  const k8sQueryOptions = convertToK8sQueryParams(resourceInit);
  const wsError = useK8sQueryWatch(
    resourceInit?.watch ? { model, queryOptions: k8sQueryOptions } : null,
    resourceInit?.isList,
    hashKey(createQueryKeys({ model, queryOptions: k8sQueryOptions })),
    options,
  );
  const getQueryOptions = (): UseQueryOptions<R> => {
    const baseQueryOptions = {
      enabled: !!resourceInit,
      refetchInterval: wsError ? POLLING_INTERVAL : undefined,
      ...queryOptions,
    };
    return (
      resourceInit?.isList
        ? createListqueryOptions(
            { model, queryOptions: k8sQueryOptions, fetchOptions: options },
            baseQueryOptions as TQueryOptions<K8sResourceCommon[]>,
          )
        : createGetQueryOptions(
            { model, queryOptions: k8sQueryOptions, fetchOptions: options },
            baseQueryOptions as Omit<TQueryOptions<K8sResourceCommon>, 'filterData'>,
          )
    ) as UseQueryOptions<R>;
  };

  const query = useQuery<R>(getQueryOptions());

  const extra = React.useMemo(
    () => ({
      wsError,
    }),
    [wsError],
  );

  return new Proxy(query, {
    get(target, prop) {
      if (prop in extra) return extra[prop];
      return Reflect.get(target, prop);
    },
    has(target, prop) {
      return prop in extra || prop in target;
    },
  }) as UseQueryResult<R> & { wsError: unknown };
};
