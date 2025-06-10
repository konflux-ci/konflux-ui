import React from 'react';
import { useK8sWatchResource } from '../k8s';
import { SecretGroupVersionKind, SecretModel } from '../models';
import { SecretKind } from '../types';

export const useSecrets = (
  namespace: string,
  watch?: boolean,
): [SecretKind[], boolean, unknown] => {
  const {
    data: secrets,
    isLoading,
    error,
  } = useK8sWatchResource<SecretKind[]>(
    {
      groupVersionKind: SecretGroupVersionKind,
      namespace,
      isList: true,
      watch,
    },
    SecretModel,
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
