import { omit } from 'lodash-es';
import { ApplicationModel, ComponentModel, ServiceAccountModel } from '../../../models';
import {
  AddSecretFormValues,
  BuildTimeSecret,
  ComponentKind,
  ComponentSpecs,
  ImagePullSecretType,
  SecretFor,
  SecretFormValues,
  SecretKind,
  SecretType,
  SecretTypeDropdownLabel,
  SourceSecretType,
} from '../../../types';

export const mockApplicationRequestData = {
  apiVersion: `${ApplicationModel.apiGroup}/${ApplicationModel.apiVersion}`,
  kind: ApplicationModel.kind,
  metadata: {
    name: 'test-application',
    namespace: 'test-ns',
  },
  spec: {
    displayName: 'test-application',
  },
};

export const mockServiceAccounts = [
  {
    apiVersion: `${ServiceAccountModel.apiGroup}/${ServiceAccountModel.apiVersion}`,
    kind: ServiceAccountModel.kind,
    metadata: { name: 'sa-1' },
  },
  {
    apiVersion: `${ServiceAccountModel.apiGroup}/${ServiceAccountModel.apiVersion}`,
    kind: ServiceAccountModel.kind,
    metadata: { name: 'sa-2' },
  },
];

export const mockSecret: SecretKind = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'my-secret',
    namespace: 'my-namespace',
  },
  data: {},
  type: 'Opaque',
};

export const mockComponent: ComponentSpecs = {
  componentName: 'Test Component',
  application: 'test-application',
  source: {
    git: {
      url: 'http://github.com/test-repo',
    },
  },
};

export const mockComponentWithDevfile = {
  ...mockComponent,
  source: {
    git: {
      ...mockComponent.source.git,
      devfileUrl: 'https://registry.devfile.io/sample-devfile',
    },
  },
};

export const mockComponentData: ComponentKind = {
  apiVersion: `${ComponentModel.apiGroup}/${ComponentModel.apiVersion}`,
  kind: ComponentModel.kind,
  metadata: {
    name: 'test-component',
    namespace: 'test-ns',
    annotations: {
      'build.appstudio.openshift.io/request': 'configure-pac',
    },
  },
  spec: {
    componentName: mockComponent.componentName,
    application: 'test-application',
    source: {
      git: { url: mockComponent.source.git.url },
    },
    containerImage: undefined,
    env: undefined,
    replicas: undefined,
    resources: undefined,
    secret: undefined,
  },
};

export const mockComponentDataWithDevfile: ComponentKind = {
  ...mockComponentData,
  spec: {
    ...mockComponentData.spec,
    source: {
      git: {
        url: mockComponent.source.git.url,
        devfileUrl: 'https://registry.devfile.io/sample-devfile',
      },
    },
  },
};

export const mockComponentDataWithoutAnnotation = omit(
  mockComponentDataWithDevfile,
  'metadata.annotations',
);

export const mockComponentDataWithPAC = {
  ...mockComponentDataWithDevfile,
  metadata: {
    ...mockComponentDataWithDevfile.metadata,
    annotations: {
      'build.appstudio.openshift.io/request': 'configure-pac',
    },
  },
};

export const addSecretFormValues: AddSecretFormValues = {
  type: 'Image pull secret',
  name: 'test',
  secretFor: SecretFor.Build,
  opaque: {
    keyValues: [
      {
        key: 'test',
        value: 'dGVzdA==',
      },
    ],
  },
  image: {
    authType: ImagePullSecretType.ImageRegistryCreds,
    registryCreds: [
      {
        registry: 'test.io',
        username: 'test',
        password: 'test',
        email: 'test@test.com',
      },
    ],
  },
  source: {
    authType: 'Basic authentication',
    username: 'test',
    password: 'test',
  },
  labels: [{ key: 'test', value: 'test' }],
  relatedComponents: [],
  secretForComponentOption: null,
};

export const existingSecrets: BuildTimeSecret[] = [
  {
    type: SecretType.dockercfg,
    name: 'secret-test',
    providerUrl: '',
    tokenKeyName: '',
    opaque: { keyValuePairs: [{ key: 'key1', value: 'value1' }] },
  },
];

export const secretFormValues: SecretFormValues = {
  type: SecretTypeDropdownLabel.opaque,
  secretName: 'test',
  opaque: {
    keyValues: [
      {
        key: 'test',
        value: 'dGVzdA==',
      },
    ],
  },
  image: {
    authType: ImagePullSecretType.ImageRegistryCreds,
  },
  relatedComponents: [],
  secretForComponentOption: null,
  existingSecrets,
};

export const secretFormValuesForSourceSecret: SecretFormValues = {
  type: SecretTypeDropdownLabel.source,
  secretName: 'test',
  source: {
    authType: SourceSecretType.basic,
    username: 'username-test',
    password: 'password-test',
  },
  relatedComponents: [],
  secretForComponentOption: null,
  existingSecrets,
};
