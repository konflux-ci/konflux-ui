import type { UseQueryOptions } from '@tanstack/react-query';
import { K8S_QUERY_KEY_SECRET_TABLE } from '~/k8s/consts/k8s-accept';
import { queryClient } from '~/k8s/query/core';
import { createListqueryOptions, createQueryKeys } from '~/k8s/query/utils';
import { SecretModel } from '~/models';
import { SecretKind } from '~/types';
import {
  fetchK8sSecretTableList,
  SECRET_TABLE_K8S_FETCH_OPTIONS,
  selectSecretList,
} from './secret-table-utils';

export const createSecretListTableQueryKey = (namespace: string) => [
  ...createQueryKeys({ model: SecretModel, queryOptions: { ns: namespace } }),
  K8S_QUERY_KEY_SECRET_TABLE,
];

export const createSecretListTableQueryOptions = (
  namespace: string,
  options?: Omit<UseQueryOptions<SecretKind[]>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<SecretKind[]> => {
  const k8sQueryOptions = { ns: namespace };
  const listArgs = {
    model: SecretModel,
    queryOptions: k8sQueryOptions,
    fetchOptions: SECRET_TABLE_K8S_FETCH_OPTIONS,
  };

  return createListqueryOptions(listArgs, {
    queryKey: createSecretListTableQueryKey(namespace),
    select: selectSecretList(namespace),
    queryFn: () => fetchK8sSecretTableList(listArgs),
    ...options,
  } as unknown as UseQueryOptions<SecretKind[]>);
};

export const K8sQuerySecretListTableItems = (
  namespace: string,
  options?: Omit<UseQueryOptions<SecretKind[]>, 'queryKey' | 'queryFn'>,
): Promise<SecretKind[]> =>
  queryClient.ensureQueryData(createSecretListTableQueryOptions(namespace, options));
