import { hashKey, useQuery } from '@tanstack/react-query';
import { K8sModelCommon, K8sResourceCommon, WatchK8sResource } from '../../types/k8s';
import { getResource, listResourceItems } from '../k8s-fetch';
import { convertToK8sQueryParams } from '../k8s-utils';
import { TQueryOptions } from '../query/type';
import { createQueryKeys } from '../query/utils';
import { WebSocketOptions } from '../web-socket/types';
import { useK8sQueryWatch } from './useK8sQueryWatch';

export const useK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  resourceInit: WatchK8sResource,
  model: K8sModelCommon,
  queryOptions?: TQueryOptions<R>,
  options: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  > = {},
) => {
  const k8sQueryOptions = convertToK8sQueryParams(resourceInit);

  useK8sQueryWatch(
    (resourceInit.watch ? resourceInit : undefined) as WatchK8sResource,
    model,
    hashKey(createQueryKeys([{ model, queryOptions: k8sQueryOptions }])),
    options,
  );

  const filterData = queryOptions?.filterData ?? ((a: R) => a);
  return useQuery({
    queryKey: createQueryKeys([{ model, queryOptions: k8sQueryOptions }]),
    queryFn: () => {
      return (resourceInit.isList ? listResourceItems : getResource)({
        model,
        queryOptions: k8sQueryOptions,
        fetchOptions: options,
      }).then(filterData);
    },
    ...queryOptions,
  });
};