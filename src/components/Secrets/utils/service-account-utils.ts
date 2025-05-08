import { PIPELINE_SERVICE_ACCOUNT } from '../../../consts/pipeline';
import { K8sQueryPatchResource, K8sGetResource } from '../../../k8s';
import { ServiceAccountModel } from '../../../models/service-account';
import { SecretKind, ServiceAccountKind } from '../../../types';

type SecretEntry = { name: string };

export const linkSecretToServiceAccount = async (secret: SecretKind, namespace: string) => {
  if (!secret || (!namespace && !secret.metadata?.namespace)) {
    return;
  }
  const serviceAccount = await K8sGetResource<ServiceAccountKind>({
    model: ServiceAccountModel,
    queryOptions: { name: PIPELINE_SERVICE_ACCOUNT, ns: namespace },
  });

  // get list of existing IP secrets
  const existingIPSecrets = serviceAccount?.imagePullSecrets as SecretEntry[];
  // check whether existing IP secrets list already contains the secret name
  const alreadyContainsIPSecret = existingIPSecrets.includes({ name: secret.metadata?.name });

  const imagePullSecretList = existingIPSecrets
    ? alreadyContainsIPSecret
      ? existingIPSecrets
      : [...existingIPSecrets, { name: secret.metadata.name }]
    : [{ name: secret.metadata.name }];

  // get list of existing secrets
  const existingSecrets = serviceAccount?.secrets as SecretEntry[];
  // check whether existing secrets list already contains the secret name
  const alreadyContainsSecret = existingSecrets.includes({ name: secret.metadata?.name });

  const secretList = existingSecrets
    ? alreadyContainsSecret
      ? existingSecrets
      : [...existingSecrets, { name: secret.metadata.name }]
    : [{ name: secret.metadata.name }];

  if (!alreadyContainsIPSecret || !alreadyContainsSecret) {
    return K8sQueryPatchResource({
      model: ServiceAccountModel,
      queryOptions: {
        name: PIPELINE_SERVICE_ACCOUNT,
        ns: namespace,
      },
      patches: [
        {
          op: 'replace',
          path: `/imagePullSecrets`,
          value: imagePullSecretList,
        },
        {
          op: 'replace',
          path: `/secrets`,
          value: secretList,
        },
      ],
    });
  }
  return;
};

export const unLinkSecretFromServiceAccount = async (secret: SecretKind, namespace: string) => {
  if (!secret || (!namespace && !secret.metadata?.namespace)) {
    return;
  }
  const serviceAccount = await K8sGetResource<ServiceAccountKind>({
    model: ServiceAccountModel,
    queryOptions: {
      name: PIPELINE_SERVICE_ACCOUNT,
      ns: namespace ?? secret.metadata?.namespace,
    },
  });

  const existingIPSecrets = serviceAccount?.imagePullSecrets;
  const existingSecrets = serviceAccount?.secrets;

  if (
    Array.isArray(existingIPSecrets) &&
    existingIPSecrets.length === 0 &&
    Array.isArray(existingSecrets) &&
    existingSecrets.length === 0
  ) {
    return;
  }

  const imagePullSecretsList =
    Array.isArray(existingIPSecrets) && existingIPSecrets.length >= 0
      ? (existingIPSecrets as { [key: string]: string }[]).filter(
          (s) => s.name !== secret.metadata?.name,
        )
      : [];

  const secretsList =
    Array.isArray(existingSecrets) && existingSecrets.length >= 0
      ? (existingSecrets as { [key: string]: string }[]).filter(
          (s) => s.name !== secret.metadata?.name,
        )
      : [];

  return K8sQueryPatchResource({
    model: ServiceAccountModel,
    queryOptions: {
      name: PIPELINE_SERVICE_ACCOUNT,
      ns: namespace,
    },
    patches: [
      {
        op: 'replace',
        path: `/imagePullSecrets`,
        value: imagePullSecretsList,
      },
      {
        op: 'replace',
        path: `/secrets`,
        value: secretsList,
      },
    ],
  });
};
