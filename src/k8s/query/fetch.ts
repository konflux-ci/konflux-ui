import { K8sResourceCommon } from '../../types/k8s';
import { K8sResourceListOptions, K8sResourceReadOptions } from '../k8s-fetch';
import { queryClient } from './core';
import { TQueryOptions } from './type';
import { createGetQueryOptions, createListqueryOptions } from './utils';

export const k8sQueryGetResource = <TResource extends K8sResourceCommon>(
  resourceInit: K8sResourceReadOptions,
  options: TQueryOptions<TResource>,
): Promise<TResource> =>
  queryClient.ensureQueryData<TResource>(createGetQueryOptions<TResource>(resourceInit, options));

export const K8sQueryListResourceItems = <TResource extends K8sResourceCommon[]>(
  resourceInit: K8sResourceListOptions,
  options: TQueryOptions<TResource>,
): Promise<TResource> =>
  queryClient.ensureQueryData(createListqueryOptions<TResource>(resourceInit, options));
