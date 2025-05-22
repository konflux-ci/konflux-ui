import React from 'react';
import { PIPELINE_SERVICE_ACCOUNT_PREFIX } from '../consts/pipeline';
import { useK8sWatchResource } from '../k8s';
import { SecretGroupVersionKind, SecretModel } from '../models';
import { SecretKind } from '../types';
import { useServiceAccount } from './useServiceAccount';

export const useLinkedSecrets = (
  namespace: string,
  componentName: string,
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
    },
    SecretModel,
  );

  const serviceAccountName = `${PIPELINE_SERVICE_ACCOUNT_PREFIX}${componentName}`;

  const [serviceAccount, serviceAccountLoaded, serviceAccountError] = useServiceAccount(
    namespace,
    serviceAccountName,
  );

  const serviceAccountSecrets = React.useMemo(
    () => serviceAccount?.secrets?.map((s) => s.name) || [],
    [serviceAccount?.secrets],
  );
  const serviceAccountImagePullSecrets = React.useMemo(
    () => serviceAccount?.imagePullSecrets?.map((ip) => ip.name) || [],
    [serviceAccount?.imagePullSecrets],
  );

  return React.useMemo(
    () => [
      !isLoading && !error && serviceAccountLoaded && !serviceAccountError
        ? secrets?.filter((rs) => {
            const hasLinkedSecret =
              serviceAccountSecrets.includes(rs.metadata.name) ||
              serviceAccountImagePullSecrets.includes(rs.metadata.name);
            return !rs.metadata.deletionTimestamp && hasLinkedSecret;
          })
        : [],
      !isLoading && serviceAccountLoaded,
      error || serviceAccountError,
    ],
    [
      isLoading,
      error,
      serviceAccountLoaded,
      serviceAccountError,
      secrets,
      serviceAccountSecrets,
      serviceAccountImagePullSecrets,
    ],
  );
};
