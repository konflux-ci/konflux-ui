import React from 'react';
import { useK8sWatchResource } from '../k8s';
import { SecretGroupVersionKind, ServiceAccountModel } from '../models';
import { ServiceAccountKind } from '../types';

export const useServiceAccount = (
  namespace: string,
  serviceAccountName: string,
): [ServiceAccountKind, boolean, unknown] => {
  const {
    data: serviceAccount,
    isLoading,
    error,
  } = useK8sWatchResource<ServiceAccountKind>(
    { groupVersionKind: SecretGroupVersionKind, namespace, name: serviceAccountName },
    ServiceAccountModel,
  );

  return React.useMemo(
    () => [!isLoading && !error ? serviceAccount : null, !isLoading, error],
    [isLoading, error, serviceAccount],
  );
};
