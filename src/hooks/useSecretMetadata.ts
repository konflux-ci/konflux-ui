import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { K8S_QUERY_KEY_SECRET_TABLE, SECRET_POLLING_INTERVAL } from '~/k8s/consts/k8s-accept';
import { convertToK8sQueryParams } from '~/k8s/k8s-utils';
import { createQueryKeys } from '~/k8s/query/utils';
import { fetchSecretGetTable } from '~/k8s/secret-table';
import { SecretGroupVersionKind, SecretModel } from '~/models';
import { SecretKind } from '~/types';

/** Fetches a single Secret using `as=Table` (no `data` / `stringData`; includes **type** from table columns). */
export const useSecretMetadata = (
  namespace: string,
  name: string,
): [SecretKind | undefined, boolean, unknown] => {
  const resourceInit = React.useMemo(
    () => ({
      groupVersionKind: SecretGroupVersionKind,
      namespace,
      name,
      watch: false,
    }),
    [namespace, name],
  );

  const k8sQueryOptions = React.useMemo(
    () => convertToK8sQueryParams(resourceInit),
    [resourceInit],
  );

  const queryKey = React.useMemo(
    () => [
      ...createQueryKeys({ model: SecretModel, queryOptions: k8sQueryOptions }),
      K8S_QUERY_KEY_SECRET_TABLE,
    ],
    [k8sQueryOptions],
  );

  const {
    data: secret,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => fetchSecretGetTable(namespace, name),
    enabled: !!namespace && !!name,
    refetchInterval: SECRET_POLLING_INTERVAL,
  });

  return [secret, !isLoading, error];
};
