import { Base64 } from 'js-base64';
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
  SecretLabels,
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

// Mock secrets for EditSecretForm tests (all secret types and auth variants)

export const mockOpaqueSecretForEdit: SecretKind = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'opaque-secret',
    namespace: 'test-ns',
    labels: { app: 'value' },
  },
  type: SecretType.opaque,
  data: {
    key1: Base64.encode('value1'),
    key2: Base64.encode('value2'),
  },
};

const dockerconfigjsonPayload = {
  auths: {
    'registry.example.com': {
      username: 'reguser',
      password: 'regpass',
      email: 'reg@example.com',
      auth: Base64.encode('reguser:regpass'),
    },
  },
};

export const mockImageSecretDockerconfigjsonForEdit: SecretKind = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'image-secret-dockerconfigjson',
    namespace: 'test-ns',
  },
  type: SecretType.dockerconfigjson,
  data: {
    '.dockerconfigjson': Base64.encode(JSON.stringify(dockerconfigjsonPayload)),
  },
};

const dockercfgPayload = {
  'registry.example.com': {
    username: 'cfguser',
    password: 'cfgpass',
    email: 'cfg@example.com',
    auth: Base64.encode('cfguser:cfgpass'),
  },
};

export const mockImageSecretDockercfgForEdit: SecretKind = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'image-secret-dockercfg',
    namespace: 'test-ns',
  },
  type: SecretType.dockercfg,
  data: {
    '.dockercfg': Base64.encode(JSON.stringify(dockercfgPayload)),
  },
};

export const mockSourceSecretBasicAuthForEdit: SecretKind = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'source-secret-basic',
    namespace: 'test-ns',
    labels: {
      [SecretLabels.HOST_LABEL]: 'github.com',
    },
    annotations: {
      [SecretLabels.REPO_ANNOTATION]: 'org/repo',
    },
  },
  type: SecretType.basicAuth,
  data: {
    username: Base64.encode('gituser'),
    password: Base64.encode('gitpass'),
  },
};

export const mockSourceSecretSSHForEdit: SecretKind = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'source-secret-ssh',
    namespace: 'test-ns',
    labels: {
      [SecretLabels.HOST_LABEL]: 'gitlab.com',
    },
    annotations: {
      [SecretLabels.REPO_ANNOTATION]: 'group/project',
    },
  },
  type: SecretType.sshAuth,
  data: {
    'ssh-privatekey': Base64.encode(
      '-----BEGIN OPENSSH PRIVATE KEY-----\nfake-key\n-----END OPENSSH PRIVATE KEY-----',
    ),
  },
};
