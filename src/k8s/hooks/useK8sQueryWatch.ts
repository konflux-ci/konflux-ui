import * as React from 'react';
import { filter, isEqual } from 'lodash-es';
import { K8sModelCommon, K8sResourceCommon, WatchK8sResource } from '../../types/k8s';
import { k8sListResource } from '../k8s-fetch';
import { convertToK8sQueryParams, k8sWatch } from '../k8s-utils';
import { queryClient } from '../query/core';
import { createQueryKeys } from '../query/utils';
import { MessageDataType, WebSocketOptions } from '../web-socket/types';

type K8sEvent = { type: 'ADDED' | 'DELETED' | 'MODIFIED'; object: K8sResourceCommon };

const watchListResource = async (
  model: K8sModelCommon,
  initResource: WatchK8sResource,
  fetchOptions?: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  >,
) => {
  const options = convertToK8sQueryParams(initResource);

  const response = await k8sListResource({
    model,
    queryOptions: {
      ...options,
      queryParams: {
        ...options.queryParams,
      },
    },
  });
  const queryKey = createQueryKeys({ model, queryOptions: options });
  queryClient.setQueryData(queryKey, (oldData: K8sResourceCommon) => {
    if (!isEqual(oldData, response.items)) {
      return response.items;
    }
    return undefined;
  });
  return k8sWatch(
    model,
    {
      labelSelector: initResource.selector,
      ns: options.ns,
      fieldSelector: options.queryParams.fieldSelector,
      ws: options.ws,
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
  model: K8sModelCommon,
  initResource: WatchK8sResource,
  fetchOptions?: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  >,
) => {
  const options = convertToK8sQueryParams(initResource);
  const queryKey = createQueryKeys({ model, queryOptions: options });
  if (options.name) {
    options.queryParams.fieldSelector = `metadata.name=${options.name}`;
    delete options.name;
  }
  return k8sWatch(
    model,
    {
      labelSelector: initResource.selector,
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

const WS = new Map();

export const useK8sQueryWatch = (
  resourceInit: WatchK8sResource | undefined,
  model: K8sModelCommon,
  hashedKey: string,
  options?: Partial<WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }>,
) => {
  React.useEffect(() => {
    const startWatch = async () => {
      if (resourceInit && !WS.has(hashedKey)) {
        const websocket = resourceInit.isList
          ? await watchListResource(model, resourceInit, options)
          : watchObjectResource(model, resourceInit, options);
        WS.set(hashedKey, websocket);
      }
    };
    // eslint-disable-next-line
    startWatch();
    return () => {
      if (resourceInit && WS.has(hashedKey)) {
        WS.get(hashedKey).destroy();
        WS.delete(hashedKey);
      }
    };
  }, [resourceInit, model, hashedKey, options]);
};
