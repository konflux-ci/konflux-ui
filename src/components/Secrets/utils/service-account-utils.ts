import { ComponentModel } from '~/models';
import { SecretModel } from '~/models/secret';
import { processWithPLimit } from '~/shared/utils/retry-batch-utils';
import {
  COMMON_SECRETS_LABEL,
  PIPELINE_SERVICE_ACCOUNT,
  PIPELINE_SERVICE_ACCOUNT_PREFIX,
} from '../../../consts/pipeline';
import { K8sQueryPatchResource, K8sGetResource, K8sListResourceItems } from '../../../k8s';
import { ServiceAccountModel } from '../../../models/service-account';
import { ComponentKind, SecretKind, ServiceAccountKind } from '../../../types';
import { SecretForComponentOption } from './secret-utils';

export const linkSecretToServiceAccount = async (secret: SecretKind, namespace: string) => {
  if (!secret || (!namespace && !secret.metadata?.namespace)) {
    return;
  }
  const serviceAccount = await K8sGetResource<ServiceAccountKind>({
    model: ServiceAccountModel,
    queryOptions: { name: PIPELINE_SERVICE_ACCOUNT, ns: namespace },
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

export const linkSecretToComponentServiceAccount = async (
  secret: SecretKind,
  component: ComponentKind,
) => {
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

export const unLinkSecretFromComponentServiceAccount = async (
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

export const getLinkedServiceAccounts = async (secret: SecretKind) => {
  if (!secret || !secret.metadata?.namespace) {
    return;
  }
  const allServiceAccounts: ServiceAccountKind[] = await K8sListResourceItems<ServiceAccountKind>({
    model: ServiceAccountModel,
    queryOptions: {
      ns: secret.metadata?.namespace,
    },
  });

  const linkedServiceAccounts = allServiceAccounts.filter((sa) => {
    const hasSecret = sa.secrets?.some((s) => s.name === secret.metadata.name);
    const hasImagePullSecret = sa.imagePullSecrets?.some((s) => s.name === secret.metadata.name);
    return hasSecret || hasImagePullSecret;
  });
  return linkedServiceAccounts;
};

export const unlinkSecretFromComponentServiceAccounts = async (
  secret: SecretKind,
  namespace?: string,
  components?: string[],
) => {
  if (!secret) return;

  const targetNamespace = namespace || secret.metadata.namespace;

  const allComponents = await K8sListResourceItems<ComponentKind>({
    model: ComponentModel,
    queryOptions: {
      ns: targetNamespace,
    },
  });

  const componentMap = new Map(allComponents.map((c) => [c.metadata.name, c]));
  const unlinkSecretForComponent = async (componentName: string, sec: SecretKind) => {
    const componentData = componentMap.get(componentName);
    if (componentData) {
      await unLinkSecretFromComponentServiceAccount(sec, componentData);
    }
  };

  if (components?.length > 0) {
    await processWithPLimit(components, 10, unlinkSecretForComponent, secret);
  } else {
    const relatedServiceAccounts = await getLinkedServiceAccounts(secret);
    const componentNames = relatedServiceAccounts.map((sa) =>
      sa.metadata.name.replace(PIPELINE_SERVICE_ACCOUNT_PREFIX, ''),
    );
    await processWithPLimit(componentNames, 10, unlinkSecretForComponent, secret);
  }
};

export const linkSecretToComponentServiceAccounts = async (
  secret: SecretKind,
  components: string[],
  allOrPartial: SecretForComponentOption,
) => {
  if (!secret || !components || !secret.metadata?.namespace) return;

  const allComponents = await K8sListResourceItems<ComponentKind>({
    model: ComponentModel,
    queryOptions: {
      ns: secret.metadata.namespace,
    },
  });

  const selectedComponents =
    allOrPartial === SecretForComponentOption.all
      ? allComponents
      : allComponents.filter((c) => components.includes(c.metadata.name));

  const linkSecretForComponent = async (component: ComponentKind, sec: SecretKind) => {
    await linkSecretToComponentServiceAccount(sec, component);
  };

  await processWithPLimit(selectedComponents, 10, linkSecretForComponent, secret);
};

export const linkCommonSecretsToComponentServiceAccount = async (component: ComponentKind) => {
  if (!component || !component.metadata?.namespace) {
    return;
  }

  const commonSecrets: SecretKind[] = await K8sListResourceItems<SecretKind>({
    model: SecretModel,
    queryOptions: {
      ns: component.metadata.namespace,
      queryParams: {
        labelSelector: {
          matchLabels: { [COMMON_SECRETS_LABEL]: 'true' },
        },
      },
    },
  });

  await processWithPLimit(commonSecrets, 10, linkSecretToComponentServiceAccount, component);
};
