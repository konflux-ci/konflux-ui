import React from 'react';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useK8sWatchResource } from '~/k8s';
import { K8S_QUERY_KEY_SECRET_TABLE, SECRET_POLLING_INTERVAL } from '~/k8s/consts/k8s-accept';
import { convertToK8sQueryParams } from '~/k8s/k8s-utils';
import { createQueryKeys } from '~/k8s/query/utils';
import { fetchSecretListTable } from '~/k8s/secret-table';
import { SecretGroupVersionKind, SecretModel } from '~/models';
import { SecretKind } from '~/types';

export type UseSecretsOptions = {
  /**
   * When true, list uses `as=Table` (no secret `data`). Preserves the printed **Type** column.
   * Watch is disabled; polling refetches instead.
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

  const listQueryKey = React.useMemo(() => {
    if (!metadataOnly) {
      return undefined;
    }
    const k8sQueryOptions = convertToK8sQueryParams(resourceInit);
    return [
      ...createQueryKeys({ model: SecretModel, queryOptions: k8sQueryOptions }),
      K8S_QUERY_KEY_SECRET_TABLE,
    ];
  }, [metadataOnly, resourceInit]);

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
          queryFn: () => fetchSecretListTable(namespace),
          refetchInterval: SECRET_POLLING_INTERVAL,
        } as UseQueryOptions<SecretKind[]>)
      : undefined,
    {},
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

export const useSecret = (
  namespace: string,
  name: string,
): [SecretKind | undefined, boolean, unknown] => {
  const {
    data: secret,
    isLoading,
    error,
  } = useK8sWatchResource<SecretKind>(
    {
      groupVersionKind: SecretGroupVersionKind,
      namespace,
      name,
    },
    SecretModel,
  );
  return [secret, !isLoading, error];
};
