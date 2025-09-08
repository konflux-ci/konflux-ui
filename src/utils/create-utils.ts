import { Base64 } from 'js-base64';
import { isEqual, isNumber, pick } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import {
  addCommonSecretLabelToBuildSecret,
  linkSecretToBuildServiceAccount,
  linkSecretToServiceAccounts,
  updateAnnotateForSecret,
} from '~/components/Secrets/utils/service-account-utils';
import { BackgroundTaskInfo } from '~/consts/backgroundjobs';
import { LINKING_ERROR_ANNOTATION, LINKING_STATUS_ANNOTATION } from '~/consts/secrets';
import { HttpError } from '~/k8s/error';
import {
  getAnnotationForSecret,
  getLabelsForSecret,
  getSecretFormData,
  SecretForComponentOption,
} from '../components/Secrets/utils/secret-utils';
import { k8sCreateResource, K8sGetResource, K8sListResourceItems } from '../k8s/k8s-fetch';
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
  ImportSecret,
  ImageRepositoryKind,
  ImageRepositoryVisibility,
  SecretTypeDropdownLabel,
  SourceSecretType,
  SecretFormValues,
  ImagePullSecretType,
} from '../types';
import { ComponentSpecs } from './../types/component';
import { SBOMEventNotification } from './../types/konflux-public-info';
import { queueInstance } from './async-queue';
import {
  BuildRequest,
  BUILD_REQUEST_ANNOTATION,
  GIT_PROVIDER_ANNOTATION,
  GITLAB_PROVIDER_URL_ANNOTATION,
} from './component-utils';
import { BackgroundJobStatus, useTaskStore } from './task-store';

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

export const getSecretObject = (values: SecretFormValues, namespace: string): SecretKind => {
  let data = {};
  if (values.type === SecretTypeDropdownLabel.source) {
    if (values.source.authType === SourceSecretType.basic) {
      const authObj = pick(values.source, ['username', 'password']);
      data = Object.entries(authObj).reduce((acc, [key, value]) => {
        acc[key] = Base64.encode(value);
        return acc;
      }, {});
    } else {
      const SSH_KEY = 'ssh-privatekey';
      data[SSH_KEY] = values.source[SSH_KEY];
    }
  } else if (values.type === SecretTypeDropdownLabel.image) {
    if (values.image.authType === ImagePullSecretType.ImageRegistryCreds) {
      const dockerconfigjson = values.image.registryCreds.reduce(
        (acc, cred) => {
          acc.auths[cred.registry] = {
            ...pick(cred, ['username', 'password', 'email']),
            auth: Base64.encode(`${cred.username}:${cred.password}`),
          };
          return acc;
        },
        { auths: {} },
      );

      data = dockerconfigjson
        ? { ['.dockerconfigjson']: Base64.encode(JSON.stringify(dockerconfigjson)) }
        : '';
    } else {
      data = values.image.dockerconfig
        ? {
            ['.dockercfg']: Base64.encode(
              JSON.stringify(JSON.parse(Base64.decode(values.image.dockerconfig))),
            ),
          }
        : '';
    }
  } else {
    const keyValues = values.opaque?.keyValues;
    data = keyValues?.reduce((acc, s) => {
      acc[s.key] = s.value ? s.value : '';
      return acc;
    }, {});
  }
  const secretResource: SecretKind = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      name: values.secretName,
      namespace,
    },
    type:
      values.type === SecretTypeDropdownLabel.source
        ? K8sSecretType[values.source?.authType]
        : K8sSecretType[values.type],
  };
  if (values.type === SecretTypeDropdownLabel.image) secretResource.data = data;
  else secretResource.stringData = data;
  return secretResource;
};

export const enqueueLinkingTask = async (
  secret: SecretKind,
  relatedComponents: string[],
  option: SecretForComponentOption,
  componentName?: string,
) => {
  const { setTaskStatus } = useTaskStore.getState();
  const taskId = `${secret.metadata.name}`;
  setTaskStatus(taskId, BackgroundTaskInfo.SecretTask.action, BackgroundJobStatus.Pending);
  await updateAnnotateForSecret(secret, LINKING_STATUS_ANNOTATION, BackgroundJobStatus.Pending);

  queueInstance.enqueue(async () => {
    setTaskStatus(taskId, BackgroundTaskInfo.SecretTask.action, BackgroundJobStatus.Running);
    await updateAnnotateForSecret(secret, LINKING_STATUS_ANNOTATION, BackgroundJobStatus.Running);

    try {
      await linkSecretToServiceAccounts(secret, relatedComponents, option);

      // If it is a imported build secret, we need to add label & link to
      // just created component
      if (option === SecretForComponentOption.all && componentName) {
        await addCommonSecretLabelToBuildSecret(secret);
      }

      const createdComponent = await K8sGetResource<ComponentKind>({
        model: ComponentModel,
        queryOptions: { name: componentName, ns: secret.metadata.namespace },
      });

      if (createdComponent) {
        await linkSecretToBuildServiceAccount(secret, createdComponent);
      }

      setTaskStatus(taskId, BackgroundTaskInfo.SecretTask.action, BackgroundJobStatus.Succeeded);
      // remove annotation error for editing secrets in the furture
      await updateAnnotateForSecret(secret, LINKING_ERROR_ANNOTATION);
      await updateAnnotateForSecret(
        secret,
        LINKING_STATUS_ANNOTATION,
        BackgroundJobStatus.Succeeded,
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to link secret:', err);
      const httpError = err as HttpError;

      const errMessage = Array.isArray(httpError)
        ? httpError.map((e) => e.error?.json?.message).join('\n')
        : httpError?.message || 'Unkown Error';

      setTaskStatus(
        taskId,
        BackgroundTaskInfo.SecretTask.action,
        BackgroundJobStatus.Failed,
        errMessage,
      );

      try {
        await updateAnnotateForSecret(
          secret,
          LINKING_STATUS_ANNOTATION,
          BackgroundJobStatus.Failed,
        );
        await updateAnnotateForSecret(secret, LINKING_ERROR_ANNOTATION, errMessage);
      } catch (annotateErr) {
        // eslint-disable-next-line no-console
        console.error('Failed to annotate secret with error:', annotateErr);
      }
    }
  });
};

export const createSecretResourceWithLinkingComponents = async (
  values: AddSecretFormValues,
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

  const createdSecret = await K8sQueryCreateResource({
    model: SecretModel,
    resource: k8sSecretResource,
    queryOptions: { ns: namespace, ...(dryRun && { queryParams: { dryRun: 'All' } }) },
  });

  if (!createdSecret || dryRun) return createdSecret;

  if (
    values.secretForComponentOption &&
    values.secretForComponentOption !== SecretForComponentOption.none
  ) {
    void enqueueLinkingTask(
      secretResource,
      values.relatedComponents,
      values.secretForComponentOption,
    );
  }

  return createdSecret;
};

export const addSecretWithLinkingComponents = async (
  values: AddSecretFormValues,
  namespace: string,
) => {
  return await createSecretResourceWithLinkingComponents(values, namespace, false);
};

export const createSecretWithLinkingComponents = async (
  secret: ImportSecret,
  componentName: string,
  namespace: string,
  dryRun: boolean,
) => {
  const secretResource = getSecretObject(secret, namespace);

  const createdSecret = await K8sQueryCreateResource({
    model: SecretModel,
    resource: secretResource,
    queryOptions: { ns: namespace, ...(dryRun && { queryParams: { dryRun: 'All' } }) },
  });

  if (!dryRun && (secret.secretForComponentOption || componentName)) {
    void enqueueLinkingTask(
      createdSecret,
      secret.relatedComponents as string[],
      secret.secretForComponentOption,
      componentName,
    );
  }

  return createdSecret;
};

type CreateImageRepositoryType = {
  application: string;
  component: string;
  namespace: string;
  isPrivate: boolean;
  bombinoUrl: string;
  notifications: SBOMEventNotification[];
};

export const createImageRepository = async (
  {
    application,
    component,
    namespace,
    isPrivate,
    notifications,
  }: Omit<CreateImageRepositoryType, 'bombinoUrl'>,
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
      notifications,
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
