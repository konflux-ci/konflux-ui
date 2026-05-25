import React from 'react';
import { PIPELINE_SERVICE_ACCOUNT_PREFIX } from '../consts/pipeline';
import { SecretKind } from '../types';
import { useSecrets } from './useSecrets';
import { useServiceAccount } from './useServiceAccount';

export const useLinkedSecrets = (
  namespace: string,
  componentName: string,
): [SecretKind[], boolean, unknown] => {
  const [secrets, secretsLoaded, secretsError] = useSecrets(namespace, true, {
    metadataOnly: true,
  });

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
      secretsLoaded && !secretsError && serviceAccountLoaded && !serviceAccountError
        ? secrets?.filter((rs) => {
            const hasLinkedSecret =
              serviceAccountSecrets.includes(rs.metadata.name) ||
              serviceAccountImagePullSecrets.includes(rs.metadata.name);
            return !rs.metadata.deletionTimestamp && hasLinkedSecret;
          })
        : [],
      secretsLoaded && serviceAccountLoaded,
      secretsError || serviceAccountError,
    ],
    [
      secretsLoaded,
      secretsError,
      serviceAccountLoaded,
      serviceAccountError,
      secrets,
      serviceAccountSecrets,
      serviceAccountImagePullSecrets,
    ],
  );
};
