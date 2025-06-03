import { LINKING_ERROR_ANNOTATION, MAX_ANNOTATION_LENGTH } from '~/consts/secrets';
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
import { ComponentKind, LinkableSecretType, SecretKind, ServiceAccountKind } from '../../../types';
import { isImagePullSecret, SecretForComponentOption } from './secret-utils';

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
  const alreadyContainsIPSecret = existingIPSecrets?.includes({ name: secret.metadata?.name });

  const imagePullSecretList = existingIPSecrets
    ? alreadyContainsIPSecret
      ? existingIPSecrets
      : [...existingIPSecrets, { name: secret.metadata.name }]
    : [{ name: secret.metadata.name }];

  // get list of existing secrets
  const existingSecrets = serviceAccount?.secrets as SecretEntry[];
  // check whether existing secrets list already contains the secret name
  const alreadyContainsSecret = existingSecrets?.includes({ name: secret.metadata?.name });

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

export const linkSecretToBuildServiceAccount = async (
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

  // get list of existing IP secrets
  const existingIPSecrets = serviceAccount?.imagePullSecrets as SecretEntry[];
  // check whether existing IP secrets list already contains the secret name
  const alreadyContainsIPSecret = existingIPSecrets?.includes({ name: secret.metadata?.name });

  const imagePullSecretList = isImagePullSecret(secret)
    ? existingIPSecrets
      ? alreadyContainsIPSecret
        ? existingIPSecrets
        : [...existingIPSecrets, { name: secret.metadata.name }]
      : [{ name: secret.metadata.name }]
    : existingIPSecrets;

  // get list of existing secrets
  const existingSecrets = serviceAccount?.secrets as SecretEntry[];
  // check whether existing secrets list already contains the secret name
  const alreadyContainsSecret = existingSecrets?.includes({ name: secret.metadata?.name });

  const secretList = existingSecrets
    ? alreadyContainsSecret
      ? existingSecrets
      : [...existingSecrets, { name: secret.metadata.name }]
    : [{ name: secret.metadata.name }];

  if (!alreadyContainsIPSecret || !alreadyContainsSecret) {
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
  }
  return;
};

export const unLinkSecretFromBuildServiceAccount = async (
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

export const filterLinkedServiceAccounts = (
  secretName: string,
  serviceAccounts: ServiceAccountKind[],
): ServiceAccountKind[] => {
  if (!secretName || !serviceAccounts) {
    return [];
  }

  return serviceAccounts.filter((sa) => {
    const isBuildServiceAccount = sa.metadata.name.startsWith(PIPELINE_SERVICE_ACCOUNT_PREFIX);
    const hasSecret = sa.secrets?.some((s) => s.name === secretName);
    const hasImagePullSecret = sa.imagePullSecrets?.some((s) => s.name === secretName);
    return isBuildServiceAccount && (hasSecret || hasImagePullSecret);
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

  return filterLinkedServiceAccounts(secret.metadata.name, allServiceAccounts);
};

export const unlinkSecretFromServiceAccounts = async (
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
      await unLinkSecretFromBuildServiceAccount(sec, componentData);
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

export const linkSecretToServiceAccounts = async (
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
    await linkSecretToBuildServiceAccount(sec, component);
  };

  await processWithPLimit(selectedComponents, 10, linkSecretForComponent, secret);
};

export const linkCommonSecretsToServiceAccount = async (component: ComponentKind) => {
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

  await processWithPLimit(commonSecrets, 10, linkSecretToBuildServiceAccount, component);
};

export const isLinkableSecret = (secret: SecretKind): boolean => {
  if (!secret) {
    return false;
  }

  const linkableValues = Object.values(LinkableSecretType) as string[];
  return linkableValues.includes(secret.type);
};

export const addCommonSecretLabelToBuildSecret = async (secret: SecretKind) => {
  if (!secret || !secret.metadata?.name || !secret.metadata?.namespace) {
    return;
  }

  const createdSecret = await K8sGetResource<SecretKind>({
    model: SecretModel,
    queryOptions: {
      name: secret.metadata.name,
      ns: secret.metadata?.namespace,
    },
  });

  const currentLabels = createdSecret.metadata.labels || {};
  if (currentLabels[COMMON_SECRETS_LABEL] === 'true') {
    return;
  }

  const updatedLabels = {
    ...currentLabels,
    [COMMON_SECRETS_LABEL]: 'true',
  };

  await K8sQueryPatchResource({
    model: SecretModel,
    queryOptions: {
      name: secret.metadata.name,
      ns: secret.metadata.namespace,
    },
    patches: [
      {
        op: 'replace',
        path: '/metadata/labels',
        value: updatedLabels,
      },
    ],
  });
};

//Updates the linking error message annotation for the Secret
export const annotateSecretWithLinkError = async (
  secret: SecretKind,
  errorMessage?: string,
): Promise<void> => {
  const namespace = secret.metadata?.namespace;
  const name = secret.metadata?.name;

  if (!namespace || !name) {
    throw new Error('Secret must have metadata.namespace and metadata.name');
  }

  const annotationKey = LINKING_ERROR_ANNOTATION;
  const annotationPath = `/metadata/annotations/${annotationKey.replace(/\//g, '~1')}`;

  const patches = [];

  if (errorMessage !== undefined) {
    const safeErrorMessage =
      errorMessage.length > MAX_ANNOTATION_LENGTH
        ? `${errorMessage.slice(0, MAX_ANNOTATION_LENGTH - 3)}...`
        : errorMessage;

    if (secret.metadata.annotations && secret.metadata.annotations[annotationKey]) {
      patches.push({
        op: 'replace' as const,
        path: annotationPath,
        value: safeErrorMessage,
      });
    } else {
      if (secret.metadata.annotations) {
        patches.push({
          op: 'add' as const,
          path: annotationPath,
          value: safeErrorMessage,
        });
      } else {
        patches.push({
          op: 'add' as const,
          path: '/metadata/annotations',
          value: {
            [annotationKey]: safeErrorMessage,
          },
        });
      }
    }
  } else {
    if (secret.metadata.annotations?.[annotationKey]) {
      patches.push({
        op: 'remove' as const,
        path: annotationPath,
      });
    }
  }

  if (patches.length === 0) {
    return;
  }

  await K8sQueryPatchResource({
    model: SecretModel,
    queryOptions: {
      name,
      ns: namespace,
    },
    patches,
  });
};
