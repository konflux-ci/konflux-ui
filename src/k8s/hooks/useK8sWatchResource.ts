import { useQuery } from '@tanstack/react-query';
import { K8sModelCommon, K8sResourceCommon, WatchK8sResource } from '../../types/k8s';
import { getResource, K8sResourceBaseOptions, listResourceItems } from '../k8s-fetch';
import { convertToK8sQueryParams } from '../k8s-utils';
import { TQueryOptions } from '../query/type';
import { createQueryOptions } from '../query/utils';

export const useK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  resourceInit: WatchK8sResource,
  model: K8sModelCommon,
  queryOptions?: TQueryOptions<R>,
) => {
  const k8sQueryOptions = convertToK8sQueryParams(resourceInit);
  return useQuery(
    createQueryOptions<R>(resourceInit.isList ? listResourceItems : getResource)(
      [
        { queryOptions: k8sQueryOptions, model } as K8sResourceBaseOptions,
        resourceInit.groupVersionKind,
      ],
      queryOptions,
    ),
  );
};
