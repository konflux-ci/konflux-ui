import { filter, isEqual } from 'lodash-es';
import { K8sResourceCommon } from '../types/k8s';
import { K8sResourceBaseOptions } from './k8s-fetch';
import { k8sWatch } from './k8s-utils';
import { queryClient } from './query/core';
import { createQueryKeys } from './query/utils';
import { MessageDataType, WebSocketOptions } from './web-socket/types';

type K8sEvent = { type: 'ADDED' | 'DELETED' | 'MODIFIED'; object: K8sResourceCommon };

export const watchListResource = (
  { model, queryOptions }: K8sResourceBaseOptions,
  fetchOptions?: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  >,
) => {
  const queryKey = createQueryKeys({ model, queryOptions });
  return k8sWatch(
    model,
    {
      labelSelector: queryOptions.queryParams.labelSelector,
      ns: queryOptions.ns,
      fieldSelector: queryOptions.queryParams.fieldSelector,
      // resourceVersion: response.metadata.resourceVersion,
    },
    { ...fetchOptions, timeout: 60_000 },
  ).onBulkMessage((events: MessageDataType[]) => {
    const safeEvents = filter(events, (e: MessageDataType): e is K8sEvent => typeof e !== 'string');
    safeEvents.forEach(({ type, object: resource }: K8sEvent) => {
      queryClient.setQueryData(queryKey, (oldData: K8sResourceCommon[]) => {
        if (oldData === undefined) {
          return undefined;
        }
        switch (type) {
          case 'ADDED': {
            const index = oldData.findIndex(
              (item) => item.metadata.name === resource.metadata.name,
            );
            return index === -1 ? [...oldData, resource] : oldData;
          }
          case 'MODIFIED': {
            const index = oldData.findIndex(
              (item) => item.metadata.name === resource.metadata.name,
            );
            if (index === -1) return oldData;

            const oldItem = oldData[index];
            const newItem = { ...oldItem, ...resource };

            // Check if only resourceVersion has changed
            const oldItemWithoutVersion = { ...oldItem };
            const newItemWithoutVersion = { ...newItem };
            delete oldItemWithoutVersion.metadata.resourceVersion;
            delete newItemWithoutVersion.metadata.resourceVersion;

            if (isEqual(oldItemWithoutVersion, newItemWithoutVersion)) {
              // Only resourceVersion has changed, update it in place
              oldData[index].metadata.resourceVersion = resource.metadata.resourceVersion;
              return oldData;
            }

            // Other data has changed, create a new array
            const newData = [...oldData];
            newData[index] = newItem;
            return newData;
          }
          case 'DELETED': {
            const newData = oldData.filter((item) => item.metadata.name !== resource.metadata.name);
            return newData.length === oldData.length ? oldData : newData;
          }
          default:
            // eslint-disable-next-line no-console
            console.warn('Unknown event type:', type);
            return oldData;
        }
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
  const queryKey = createQueryKeys({ model, queryOptions });
  return k8sWatch(
    model,
    {
      labelSelector: queryOptions.queryParams?.labelSelector,
      ns: queryOptions.ns,
      fieldSelector: `metadata.name=${queryOptions.name}`,
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
          return oldData;
        }
        return newObj;
      });
    });
  });
};
