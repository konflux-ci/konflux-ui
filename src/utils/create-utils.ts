import { isEqual, isNumber } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import {
  getAnnotationForSecret,
  getLabelsForSecret,
  getSecretFormData,
  typeToLabel,
} from '../components/Secrets/utils/secret-utils';
import { linkSecretToServiceAccount } from '../components/Secrets/utils/service-account-utils';
import { k8sCreateResource, K8sListResourceItems } from '../k8s/k8s-fetch';
import { K8sQueryCreateResource, K8sQueryUpdateResource } from '../k8s/query/fetch';
import {
  ApplicationModel,
  ComponentModel,
  ComponentDetectionQueryModel,
  SPIAccessTokenBindingModel,
  SecretModel,
  ImageRepositoryModel,
} from '../models';
import {
  ComponentKind,
  ApplicationKind,
  ComponentDetectionQueryKind,
  SPIAccessTokenBindingKind,
  K8sSecretType,
  SecretKind,
  AddSecretFormValues,
  SecretTypeDisplayLabel,
  ImportSecret,
  ImageRepositoryKind,
  ImageRepositoryVisibility,
} from '../types';
import { ComponentSpecs } from './../types/component';
import {
  BuildRequest,
  BUILD_REQUEST_ANNOTATION,
  GIT_PROVIDER_ANNOTATION,
  GITLAB_PROVIDER_URL_ANNOTATION,
} from './component-utils';

export const sanitizeName = (name: string) => name.split(/ |\./).join('-').toLowerCase();

/**
 * Create HAS Application CR
 * @param application application name
 * @param namespace namespace of the application
 * @param dryRun dry run without creating any resources
 * @returns Returns HAS Application CR data
 *
 * TODO: Return type any should be changed to a proper type like K8sResourceCommon
 */
export const createApplication = (
  application: string,
  namespace: string,
  dryRun?: boolean,
): Promise<ApplicationKind> => {
  const requestData = {
    apiVersion: `${ApplicationModel.apiGroup}/${ApplicationModel.apiVersion}`,
    kind: ApplicationModel.kind,
    metadata: {
      name: application,
      namespace,
    },
    spec: {
      displayName: application,
    },
  };

  return K8sQueryCreateResource({
    model: ApplicationModel,
    queryOptions: {
      name: application,
      ns: namespace,
      ...(dryRun && { queryParams: { dryRun: 'All' } }),
    },
    resource: requestData,
  });
};

/**
 * Create HAS Component CR
 *
 * @param component component data
 * @param application application name
 * @param namespace namespace of the application
 * @param dryRun dry run without creating any resources
 * @param annotations optional set of additional annotations
 * @returns Returns HAS Component CR data
 *
 * TODO: Return type any should be changed to a proper type like K8sResourceCommon
 */
export const createComponent = (
  // TODO need better type for `component`
  component: ComponentSpecs,
  application: string,
  namespace: string,
  secret?: string,
  dryRun?: boolean,
  originalComponent?: ComponentKind,
  verb: 'create' | 'update' = 'create',
  enablePac: boolean = true,
  annotations?: { [key: string]: string },
) => {
  const {
    componentName,
    gitProviderAnnotation,
    gitURLAnnotation,
    containerImage,
    source,
    replicas,
    resources,
    env,
    targetPort,
  } = component;

  const name = component.componentName.split(/ |\./).join('-').toLowerCase();

  const newComponent = {
    apiVersion: `${ComponentModel.apiGroup}/${ComponentModel.apiVersion}`,
    kind: ComponentModel.kind,
    metadata: {
      name,
      namespace,
      ...(verb === 'create' &&
        (enablePac
          ? {
              annotations: {
                [BUILD_REQUEST_ANNOTATION]: BuildRequest.configurePac,
              },
            }
          : {})),
    },
    spec: {
      componentName,
      application,
      source,
      secret,
      containerImage,
      replicas,
      ...(isNumber(targetPort) && { targetPort }),
      resources,
      env,
    },
  };

  const resource =
    verb === 'update' ? { ...originalComponent, spec: newComponent.spec } : newComponent;

  // merge additional annotations
  if (annotations || gitProviderAnnotation || gitURLAnnotation) {
    // Add gitlab annotaions in case of gitlab repo
    const newAnnotations = annotations;
    if (gitProviderAnnotation || gitURLAnnotation) {
      newAnnotations[GIT_PROVIDER_ANNOTATION] = gitProviderAnnotation;
      newAnnotations[GITLAB_PROVIDER_URL_ANNOTATION] = gitURLAnnotation;
    }
    resource.metadata.annotations = { ...resource.metadata.annotations, ...newAnnotations };
  }

  return verb === 'create'
    ? K8sQueryCreateResource<ComponentKind>({
        model: ComponentModel,
        queryOptions: {
          name,
          ns: namespace,
          ...(dryRun && { queryParams: { dryRun: 'All' } }),
        },
        resource,
      })
    : K8sQueryUpdateResource<ComponentKind>({
        model: ComponentModel,
        resource,
        queryOptions: { ns: namespace },
      });
};

/**
 * Create ComponentDetectionQuery CR
 *
 * @param url the URL of the repository that will be analyzed for components
 * @param namespace namespace to deploy resource in. Defaults to current namespace
 * @param secret Name of the secret containing the personal access token
 * @param context Context directory
 * @param revision Git revision if other than master/main
 * @param dryRun dry run without creating any resources
 * @returns Returns CDQ
 *
 */
export const createComponentDetectionQuery = async (
  url: string,
  namespace: string,
  secret?: string,
  context?: string,
  revision?: string,
  dryRun?: boolean,
): Promise<ComponentDetectionQueryKind> => {
  // append name with uid for additional randomness
  const uniqueName = `cdq-${uuidv4()}`;

  const requestData = {
    apiVersion: `${ComponentDetectionQueryModel.apiGroup}/${ComponentDetectionQueryModel.apiVersion}`,
    kind: ComponentDetectionQueryModel.kind,
    metadata: {
      name: uniqueName,
      namespace,
    },
    spec: {
      git: {
        url,
        context,
        revision,
      },
      secret,
    },
  };

  return k8sCreateResource({
    model: ComponentDetectionQueryModel,
    queryOptions: {
      name: uniqueName,
      ns: namespace,
      ...(dryRun && { queryParams: { dryRun: 'All' } }),
    },
    resource: requestData,
  });
};

/**
 * Create SPIAccessTokenBinding CR
 *
 * @param url the URL of the git repository
 * @param namespace namespace to create the binding
 * @param dryRun dry run without creating any resources
 * @returns Returns created SPIAccessTokenBinding resource
 */
export const createAccessTokenBinding = async (
  url: string,
  namespace: string,
  dryRun?: boolean,
) => {
  const id = uuidv4();
  const requestData = {
    apiVersion: `${SPIAccessTokenBindingModel.apiGroup}/${SPIAccessTokenBindingModel.apiVersion}`,
    kind: SPIAccessTokenBindingModel.kind,
    metadata: {
      name: `appstudio-import-${id}`,
      namespace,
    },
    spec: {
      repoUrl: url,
      permissions: {
        required: [
          { type: 'r', area: 'repository' },
          { type: 'w', area: 'repository' },
        ],
      },
      secret: {
        name: `appstudio-token-${id}`,
        type: 'kubernetes.io/basic-auth',
      },
    },
  };

  const binding: SPIAccessTokenBindingKind = await k8sCreateResource({
    model: SPIAccessTokenBindingModel,
    queryOptions: {
      name: `appstudio-import-${id}`,
      ns: namespace,
      ...(dryRun && { queryParams: { dryRun: 'All' } }),
    },
    resource: requestData,
  });

  return binding;
};

/**
 * Create SPIAccessTokenBinding if a binding with the same Git URL & permissins
 * does not already exist.
 * Else return the existing SPIAccessTokenBinding.
 *
 * @param url the URL of the git repository
 * @param namespace namespace to create the binding
 * @returns Returns the SPIAccessTokenBinding resource
 */
export const initiateAccessTokenBinding = async (url: string, namespace: string) => {
  const bindings: SPIAccessTokenBindingKind[] = await K8sListResourceItems({
    model: SPIAccessTokenBindingModel,
    queryOptions: {
      ns: namespace,
    },
  });
  const binding = bindings.find(
    (b) =>
      b.spec.repoUrl === url &&
      isEqual(b.spec.permissions, {
        required: [
          { type: 'r', area: 'repository' },
          { type: 'w', area: 'repository' },
        ],
      }),
  );
  if (binding) {
    return binding;
  }

  return createAccessTokenBinding(url, namespace);
};

export const createSecretResource = async (
  values: AddSecretFormValues,
  workspace: string,
  namespace: string,
  dryRun: boolean,
) => {
  const secretResource: SecretKind = getSecretFormData(values, namespace);

  const labels = {
    secret: getLabelsForSecret(values),
  };
  const annotations = getAnnotationForSecret(values);
  const k8sSecretResource = {
    ...secretResource,
    metadata: {
      ...secretResource.metadata,
      labels: {
        ...labels?.secret,
      },
      annotations,
    },
  };
  // if image pull secret, link to service account
  if (typeToLabel(secretResource.type) === SecretTypeDisplayLabel.imagePull) {
    await linkSecretToServiceAccount(secretResource, namespace, workspace);
  }

  return await K8sQueryCreateResource({
    model: SecretModel,
    resource: k8sSecretResource,
    queryOptions: { ns: namespace, ...(dryRun && { queryParams: { dryRun: 'All' } }) },
  });
};

export const addSecret = async (
  values: AddSecretFormValues,
  workspace: string,
  namespace: string,
) => {
  return await createSecretResource(values, workspace, namespace, false);
};

export const createSecret = async (secret: ImportSecret, namespace: string, dryRun: boolean) => {
  const secretResource = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      name: secret.secretName,
      namespace,
    },
    type: K8sSecretType[secret.type],
    stringData: secret.keyValues.reduce((acc, s) => {
      acc[s.key] = s.value ? s.value : '';
      return acc;
    }, {}),
  };

  return await K8sQueryCreateResource({
    model: SecretModel,
    resource: secretResource,
    queryOptions: { ns: namespace, ...(dryRun && { queryParams: { dryRun: 'All' } }) },
  });
};

type CreateImageRepositoryType = {
  application: string;
  component: string;
  namespace: string;
  isPrivate: boolean;
  bombinoUrl: string;
};

export const createImageRepository = (
  { application, component, namespace, isPrivate, bombinoUrl }: CreateImageRepositoryType,
  dryRun: boolean = false,
) => {
  const imageRepositoryResource: ImageRepositoryKind = {
    apiVersion: `${ImageRepositoryModel.apiGroup}/${ImageRepositoryModel.apiVersion}`,
    kind: ImageRepositoryModel.kind,
    metadata: {
      name: component,
      namespace,
      labels: {
        'appstudio.redhat.com/component': component,
        'appstudio.redhat.com/application': application,
      },
      annotations: {
        'image-controller.appstudio.redhat.com/update-component-image': 'true',
      },
    },
    spec: {
      image: {
        visibility: isPrivate
          ? ImageRepositoryVisibility.private
          : ImageRepositoryVisibility.public,
      },
      notifications: [
        {
          title: 'SBOM-event-to-Bombino',
          event: 'repo_push',
          method: 'webhook',
          config: {
            url: bombinoUrl,
          },
        },
      ],
    },
  };

  return K8sQueryCreateResource({
    model: ImageRepositoryModel,
    resource: imageRepositoryResource,
    queryOptions: {
      ns: namespace,
      ...(dryRun && { queryParams: { dryRun: 'All' } }),
    },
  });
};
