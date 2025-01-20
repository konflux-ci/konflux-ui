import { omit } from 'lodash-es';
import { ApplicationModel, ComponentModel } from '../../../models';
import {
  AddSecretFormValues,
  BuildTimeSecret,
  ComponentKind,
  ComponentSpecs,
  SecretFor,
  SecretFormValues,
  SecretType,
  SecretTypeDropdownLabel,
  SourceSecretType,
} from '../../../types';
import { THUMBNAIL_ANNOTATION } from '../../ApplicationThumbnail';

export const mockApplicationRequestData = {
  apiVersion: `${ApplicationModel.apiGroup}/${ApplicationModel.apiVersion}`,
  kind: ApplicationModel.kind,
  metadata: {
    name: 'test-application',
    namespace: 'test-ns',
    annotations: {
      [THUMBNAIL_ANNOTATION]: '7',
    },
  },
  spec: {
    displayName: 'test-application',
  },
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
    authType: 'Image registry credentials',
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
};

export const existingSecrets: BuildTimeSecret[] = [
  {
    type: SecretType.dockercfg,
    name: 'secret-test',
    providerUrl: '',
    tokenKeyName: '',
    keyValuePairs: [{ key: 'key1', value: 'value1' }],
  },
];

export const secretFormValues: SecretFormValues = {
  type: SecretTypeDropdownLabel.image,
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
    keyValues: [
      {
        key: 'test',
        value: 'dGVzdA==',
      },
    ],
  },
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
  existingSecrets,
};
