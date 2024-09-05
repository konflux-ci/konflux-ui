import { filter, isEqual } from 'lodash-es';
import { K8sResourceCommon } from '../types/k8s';
import { k8sListResource, K8sResourceBaseOptions } from './k8s-fetch';
import { k8sWatch } from './k8s-utils';
import { queryClient } from './query/core';
import { createQueryKeys } from './query/utils';
import { MessageDataType, WebSocketOptions } from './web-socket/types';

type K8sEvent = { type: 'ADDED' | 'DELETED' | 'MODIFIED'; object: K8sResourceCommon };

export const watchListResource = async (
  { model, queryOptions }: K8sResourceBaseOptions,
  fetchOptions?: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  >,
) => {
  const response = await k8sListResource({ model, queryOptions });
  const queryKey = createQueryKeys({ model, queryOptions });
  queryClient.setQueryData(queryKey, (oldData: K8sResourceCommon) => {
    if (!isEqual(oldData, response.items)) {
      return response.items;
    }
    return undefined;
  });
  return k8sWatch(
    model,
    {
      labelSelector: queryOptions.queryParams.labelSelector,
      ns: queryOptions.ns,
      fieldSelector: queryOptions.queryParams.fieldSelector,
      ws: queryOptions.ws,
      resourceVersion: response.metadata.resourceVersion,
    },
    { ...fetchOptions, timeout: 60_000 },
  ).onBulkMessage((events: MessageDataType[]) => {
    const safeEvents = filter(events, (e: MessageDataType): e is K8sEvent => typeof e !== 'string');
    safeEvents.forEach(({ type, object }: K8sEvent) => {
      queryClient.setQueryData(queryKey, (oldData: K8sResourceCommon[]) => {
        if (oldData === undefined) {
          return undefined;
        }
        if (type === 'DELETED') {
          return oldData.filter((obj) => obj.metadata?.name !== object.metadata?.name);
        } else if (['ADDED', 'MODIFIED'].includes(type)) {
          const index = oldData.findIndex((d) => d.metadata?.uid === object.metadata?.uid);
          if (index === -1) {
            return [...oldData, object];
          }
          oldData[index] = object;
          return oldData;
        }
        return undefined;
      });
    });
  });
};

export const watchObjectResource = (
  { model, queryOptions }: K8sResourceBaseOptions,
  fetchOptions?: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  >,
) => {
  const options = { ...queryOptions };
  const queryKey = createQueryKeys({ model, queryOptions });
  if (options.name) {
    options.queryParams.fieldSelector = `metadata.name=${options.name}`;
    delete options.name;
  }
  return k8sWatch(
    model,
    {
      labelSelector: queryOptions.queryParams.labelSelector,
      ns: options.ns,
      fieldSelector: options.queryParams.fieldSelector,
      ws: options.ws,
    },
    fetchOptions,
  ).onBulkMessage((events: MessageDataType[]) => {
    events.forEach((e) => {
      if (typeof e === 'string') {
        return;
      }
      const newObj = e.object as K8sResourceCommon;
      queryClient.setQueryData(queryKey, (oldData: K8sResourceCommon) => {
        oldData.metadata.resourceVersion = newObj.metadata?.resourceVersion;
        if (isEqual(oldData, newObj)) {
          return undefined;
        }
        return newObj;
      });
    });
  });
};
