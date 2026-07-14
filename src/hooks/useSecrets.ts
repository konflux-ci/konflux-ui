import React from 'react';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useK8sWatchResource } from '~/k8s';
import { K8S_QUERY_KEY_SECRET_TABLE } from '~/k8s/consts/k8s-accept';
import { convertToK8sQueryParams } from '~/k8s/k8s-utils';
import { createQueryKeys } from '~/k8s/query/utils';
import { SecretGroupVersionKind, SecretModel } from '~/models';
import { SecretKind } from '~/types';
import {
  fetchK8sSecretTableList,
  SECRET_TABLE_K8S_FETCH_OPTIONS,
  selectSecretList,
} from '~/utils/secrets/secret-table-utils';

export type UseSecretsOptions = {
  /**
   * When true, list uses `as=Table` (no secret `data`). Preserves the printed **Type** column.
   * Watch is disabled.
   */
  metadataOnly?: boolean;
};

export const useSecrets = (
  namespace: string,
  watch?: boolean,
  options?: UseSecretsOptions,
): [SecretKind[], boolean, unknown] => {
  const metadataOnly = options?.metadataOnly ?? false;
  const resourceInit = React.useMemo(
    () => ({
      groupVersionKind: SecretGroupVersionKind,
      namespace,
      isList: true,
      watch: metadataOnly ? false : watch,
    }),
    [namespace, metadataOnly, watch],
  );

  const k8sQueryOptions = React.useMemo(
    () => convertToK8sQueryParams(resourceInit),
    [resourceInit],
  );

  const listQueryKey = React.useMemo(() => {
    if (!metadataOnly) {
      return undefined;
    }
    return [
      ...createQueryKeys({ model: SecretModel, queryOptions: k8sQueryOptions }),
      K8S_QUERY_KEY_SECRET_TABLE,
    ];
  }, [metadataOnly, k8sQueryOptions]);

  const selectSecrets = React.useMemo(() => selectSecretList(namespace), [namespace]);

  const listArgs = {
    model: SecretModel,
    queryOptions: k8sQueryOptions,
    fetchOptions: SECRET_TABLE_K8S_FETCH_OPTIONS,
  };

  const {
    data: secrets,
    isLoading,
    error,
  } = useK8sWatchResource<SecretKind[]>(
    resourceInit,
    SecretModel,
    metadataOnly
      ? ({
          queryKey: listQueryKey,
          select: selectSecrets,
          queryFn: () => fetchK8sSecretTableList(listArgs),
        } as unknown as UseQueryOptions<SecretKind[]>)
      : undefined,
    (metadataOnly ? SECRET_TABLE_K8S_FETCH_OPTIONS : {}) as Parameters<
      typeof useK8sWatchResource
    >[3],
  );

  return React.useMemo(
    () => [
      !isLoading && !error ? secrets?.filter((rs) => !rs.metadata.deletionTimestamp) : [],
      !isLoading,
      error,
    ],
    [secrets, isLoading, error],
  );
};
