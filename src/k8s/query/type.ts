import { QueryOptions } from '@tanstack/react-query';
import { K8sGroupVersionKind } from '../../types/k8s';
import { K8sResourceBaseOptions } from '../k8s-fetch';

export type CreateQueryOptionsArgs = [
  query: K8sResourceBaseOptions,
  groupVersionKind?: K8sGroupVersionKind,
];

export type TQueryOptions<TResource> = Omit<QueryOptions<TResource>, 'queryKey' | 'queryFn'> & {
  filterData?: (resource: TResource) => TResource;
};
