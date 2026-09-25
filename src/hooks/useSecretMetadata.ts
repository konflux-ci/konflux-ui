import React from 'react';
import { useK8sWatchResource } from '~/k8s';
import { K8S_QUERY_KEY_SECRET_TABLE } from '~/k8s/consts/k8s-accept';
import { convertToK8sQueryParams } from '~/k8s/k8s-utils';
import { createQueryKeys } from '~/k8s/query/utils';
import { SecretGroupVersionKind, SecretModel } from '~/models';
import { SecretKind } from '~/types';
import {
  type K8sTable,
  SECRET_TABLE_K8S_FETCH_OPTIONS,
  selectSecretMetadata,
} from '~/utils/secrets/secret-table-utils';

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

  const selectSecret = React.useMemo(
    () => selectSecretMetadata(namespace, name),
    [namespace, name],
  );

  const {
    data: secret,
    isLoading,
    error,
  } = useK8sWatchResource<SecretKind, K8sTable>(
    resourceInit,
    SecretModel,
    {
      queryKey,
      enabled: !!namespace && !!name,
      select: selectSecret,
    },
    SECRET_TABLE_K8S_FETCH_OPTIONS as Parameters<typeof useK8sWatchResource>[3],
  );

  return [secret, !isLoading, error];
};
