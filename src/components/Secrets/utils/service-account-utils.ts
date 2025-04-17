import { ComponentModel } from '~/models';
import { SecretModel } from '~/models/secret';
import { COMMON_SECRETS_LABEL, PIPELINE_SERVICE_ACCOUNT_PREFIX } from '../../../consts/pipeline';
import { K8sQueryPatchResource, K8sGetResource, K8sListResourceItems } from '../../../k8s';
import { ServiceAccountModel } from '../../../models/service-account';
import { ComponentKind, SecretKind, ServiceAccountKind } from '../../../types';
import { SecretForComponentOption } from './secret-utils';

export const linkSecretToServiceAccount = async (secret: SecretKind, component: ComponentKind) => {
  // When there is no secret/component or they are not in the same namespace, return
  if (!secret || !component || !(secret.metadata?.namespace === component?.metadata?.namespace)) {
    return;
  }

  const serviceAccountName = `${PIPELINE_SERVICE_ACCOUNT_PREFIX}${component.metadata.name}`;
  const namespace = component.metadata.namespace;

  const serviceAccount = await K8sGetResource<ServiceAccountKind>({
    model: ServiceAccountModel,
    queryOptions: { name: serviceAccountName, ns: namespace },
  });

  const existingIPSecrets = serviceAccount?.imagePullSecrets as SecretKind[];
  const imagePullSecretList = existingIPSecrets
    ? [...existingIPSecrets, { name: secret.metadata.name }]
    : [{ name: secret.metadata.name }];

  const existingSecrets = serviceAccount?.secrets as SecretKind[];
  const secretList = existingSecrets
    ? [...existingSecrets, { name: secret.metadata.name }]
    : [{ name: secret.metadata.name }];

  return K8sQueryPatchResource({
    model: ServiceAccountModel,
    queryOptions: {
      name: serviceAccountName,
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
};

export const unLinkSecretFromServiceAccount = async (
  secret: SecretKind,
  component: ComponentKind,
) => {
  if (!secret || !component || !(secret.metadata?.namespace === component?.metadata?.namespace)) {
    return;
  }

  const serviceAccountName = `${PIPELINE_SERVICE_ACCOUNT_PREFIX}${component.metadata.name}`;
  const namespace = component.metadata.namespace;

  const serviceAccount = await K8sGetResource<ServiceAccountKind>({
    model: ServiceAccountModel,
    queryOptions: {
      name: serviceAccountName,
      ns: namespace,
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
      name: serviceAccountName,
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

export const getLinkedServiceAccount = async (secret: SecretKind) => {
  if (!secret || !secret.metadata?.namespace) {
    return;
  }
  const allServiceAccounts: ServiceAccountKind[] = await K8sListResourceItems<ServiceAccountKind>({
    model: ServiceAccountModel,
    queryOptions: {
      ns: secret.metadata?.namespace,
    },
  });

  const linkedServiceAccounts = allServiceAccounts.filter((seviceAccount) =>
    seviceAccount.secrets.map((linkedSecret) => linkedSecret.name).includes(secret.metadata.name),
  );
  const linkedImagePullServiceAccounts = allServiceAccounts.filter((seviceAccount) =>
    seviceAccount.imagePullSecrets
      .map((linkedSecret) => linkedSecret.name)
      .includes(secret.metadata.name),
  );
  return [...linkedServiceAccounts, ...linkedImagePullServiceAccounts];
};

export const unlinkSecretFromServiceAccounts = async (
  secret: SecretKind,
  components?: string[],
) => {
  if (!secret || !secret.metadata?.namespace) {
    return;
  }
  const namespace = secret.metadata.namespace;

  const unlinkSecretForComponent = async (componentName: string) => {
    const componentData = await K8sGetResource<ComponentKind>({
      model: ComponentModel,
      queryOptions: {
        name: componentName,
        ns: namespace,
      },
    });
    await unLinkSecretFromServiceAccount(secret, componentData);
  };

  if (components && Array.isArray(components) && components.length > 0) {
    // Unlink secrets for explicitly provided components
    await Promise.all(components?.map(unlinkSecretForComponent));
  } else {
    // Fetch all related service accounts and unlink secrets
    const relatedServiceAccounts = await getLinkedServiceAccount(secret);

    const componentNames = relatedServiceAccounts.map((serviceAccount) =>
      serviceAccount.metadata.name.replace(PIPELINE_SERVICE_ACCOUNT_PREFIX, ''),
    );

    await Promise.all(componentNames?.map(unlinkSecretForComponent));
  }
};

export const linkSecretToServiceAccounts = async (
  secret: SecretKind,
  components: string[],
  allOrPartial: SecretForComponentOption,
) => {
  if (!secret || !components || !secret.metadata?.namespace) {
    return;
  }
  const allComponents: ComponentKind[] = await K8sListResourceItems<ComponentKind>({
    model: ComponentModel,
    queryOptions: {
      ns: secret.metadata?.namespace,
    },
  });

  const selectedComponents =
    allOrPartial === SecretForComponentOption.all
      ? allComponents
      : allComponents?.filter((component) => components.includes(component.metadata.name));

  for (const component of selectedComponents) {
    await linkSecretToServiceAccount(secret, component);
  }
};

export const linkCommonSecretsToServiceAccount = async (component: ComponentKind) => {
  if (!component || !component.metadata?.namespace) {
    return;
  }
  const commonSecrets: SecretKind[] = await K8sListResourceItems<SecretKind>({
    model: SecretModel,
    queryOptions: {
      ns: component.metadata?.namespace,
      queryParams: {
        labelSelector: {
          matchLabels: { [COMMON_SECRETS_LABEL]: 'true' },
        },
      },
    },
  });
  for (const secret of commonSecrets) {
    await linkSecretToServiceAccount(secret, component);
  }
};
