import {
  mockImageSecretDockerconfigjsonForEdit,
  mockOpaqueSecretForEdit,
  mockSecret,
} from '../../components/Secrets/__data__/mock-secrets';
import {
  sampleImagePullSecret,
  sampleOpaqueSecret,
  sampleRemoteSecrets,
} from '../../components/Secrets/__tests___/secret-data';
import * as k8sModule from '../../k8s';
import { SecretModel } from '../../models';
import {
  AddSecretFormValues,
  ImagePullSecretType,
  RemoteSecretStatusReason,
  SecretFor,
  SecretLabels,
  SecretType,
  SecretTypeDropdownLabel,
  SourceSecretType,
} from '../../types';
import {
  createSecretResource,
  editSecretResource,
  getAnnotationForSecret,
  getKubernetesSecretType,
  getLabelsForSecret,
  getRegistryCreds,
  getSecretFormData,
  getSupportedPartnerTaskKeyValuePairs,
  getSupportedPartnerTaskSecrets,
  getTargetLabelsForRemoteSecret,
  isPartnerTask,
  isPartnerTaskAvailable,
  statusFromConditions,
  supportedPartnerTasksSecrets,
  typeToDropdownLabel,
  typeToLabel,
  getSecretRowLabels,
  getSecretTypetoLabel,
  patchCommonSecretLabel,
} from '../secrets/secret-utils';

// Create a manual mock for K8sQueryPatchResource
jest.mock('../../k8s', () => {
  const actual = jest.requireActual('../../k8s');
  return {
    ...actual,
    K8sQueryPatchResource: jest.fn(),
    K8sQueryCreateResource: jest.fn(),
  };
});
const k8sPatchResourceMock = k8sModule.K8sQueryPatchResource as jest.Mock;
const k8sCreateResourceMock = k8sModule.K8sQueryCreateResource as jest.Mock;

describe('getSupportedPartnerTaskKeyValuePairs', () => {
  it('should return empty array ', () => {
    expect(getSupportedPartnerTaskKeyValuePairs()).toEqual([]);
    expect(getSupportedPartnerTaskKeyValuePairs(null)).toEqual([]);
  });

  it('should return snyk secret values ', () => {
    expect(getSupportedPartnerTaskKeyValuePairs('snyk-secret')).toEqual([
      { key: 'snyk_token', readOnlyKey: true, value: '', readOnlyValue: false },
    ]);
  });
});

describe('isPartnerTask', () => {
  it('should return true if supported partner task name is provided ', () => {
    Object.values(supportedPartnerTasksSecrets).map(({ name }) => {
      expect(isPartnerTask(name)).toBe(true);
    });
  });

  it('should return false if unsupport task name is provided ', () => {
    expect(isPartnerTask(null)).toBe(false);
    expect(isPartnerTask(undefined)).toBe(false);
    expect(isPartnerTask('invalid-partner-task')).toBe(false);
  });
});

describe('getSupportedPartnerTaskSecrets', () => {
  it('should return supported partener tasks', () => {
    expect(getSupportedPartnerTaskSecrets()).toHaveLength(1);
  });
});

describe('createSecretResource', () => {
  beforeEach(() => {
    k8sCreateResourceMock.mockClear();
    k8sCreateResourceMock.mockResolvedValue({});
  });

  it('should create Opaque secret resource', async () => {
    await createSecretResource(sampleOpaqueSecret, 'test-ns', false);
    expect(k8sCreateResourceMock).toHaveBeenCalled();
  });

  it('should create Image pull secret resource', async () => {
    await createSecretResource(sampleImagePullSecret, 'test-ns', false);
    expect(k8sCreateResourceMock).toHaveBeenCalled();
  });
});

describe('getRegistryCreds', () => {
  it('returns parsed registry credentials including password from .dockerconfigjson', () => {
    expect(getRegistryCreds(mockImageSecretDockerconfigjsonForEdit)).toEqual([
      expect.objectContaining({
        registry: 'registry.example.com',
        username: 'reguser',
        password: 'regpass',
        email: 'reg@example.com',
      }),
    ]);
  });

  it('returns default empty row when secret is not dockerconfigjson type', () => {
    expect(getRegistryCreds(mockOpaqueSecretForEdit)).toEqual([
      { registry: '', username: '', password: '', email: '' },
    ]);
  });
});

describe('statusFromConditions', () => {
  it('should return the default value', () => {
    expect(statusFromConditions(null)).toBe('-');
    expect(statusFromConditions(undefined)).toBe('-');
    expect(statusFromConditions([])).toBe('-');
  });
  it('should return the correct status from the conditions', () => {
    const awaitingSecret = sampleRemoteSecrets[RemoteSecretStatusReason.AwaitingData];
    const injectedSecret = sampleRemoteSecrets[RemoteSecretStatusReason.Injected];

    expect(statusFromConditions(awaitingSecret.status.conditions)).toBe('AwaitingData');
    expect(statusFromConditions(injectedSecret.status.conditions)).toBe('Injected');
  });
});

describe('getSecretRowLabels', () => {
  it('should return the default value', () => {
    expect(getSecretRowLabels(null).secretLabels).toBe('-');
  });

  it('should return correct label given secret', () => {
    expect(
      getSecretRowLabels({
        apiVersion: 'v1',
        kind: 'secret',
        metadata: { labels: { labelA: 'valA' } },
      }),
    ).toEqual({
      secretLabels: 'labelA=valA',
    });
  });

  it('should return the labels data for the given secret', () => {
    const secretWithLabels = {
      apiVersion: 'v1',
      kind: 'secret',
      metadata: {
        labels: {
          label1: 'test-label-1',
          label2: 'test-label-2',
        },
      },
    };

    expect(getSecretRowLabels(secretWithLabels).secretLabels).toEqual(
      'label1=test-label-1, label2=test-label-2',
    );
  });
});

describe('getSecretTypetoLabel', () => {
  it('should return early if no Secret specified', () => {
    expect(getSecretTypetoLabel(null)).toBe(undefined);
  });

  it('should return correct label for opaque', () => {
    expect(getSecretTypetoLabel(sampleImagePullSecret)).toEqual('Image pull');
  });

  it('should return correct label for key', () => {
    expect(getSecretTypetoLabel(sampleOpaqueSecret)).toEqual('Key/value');
  });
});

describe('typeToLabel', () => {
  it('should return default type for an unmatched type', () => {
    expect(typeToLabel('test')).toBe('test');
  });

  it('should return image type for an docker config type', () => {
    expect(typeToLabel(SecretType.dockerconfigjson)).toBe('Image pull');
    expect(typeToLabel(SecretType.dockercfg)).toBe('Image pull');
  });

  it('should return key/value type for an basic type', () => {
    expect(typeToLabel(SecretType.basicAuth)).toBe('Key/value');
    expect(typeToLabel(SecretType.sshAuth)).toBe('Key/value');
    expect(typeToLabel(SecretType.opaque)).toBe('Key/value');
  });
});

describe('typeToDropdownLabel', () => {
  it('should return default type for an unmatched type', () => {
    expect(typeToDropdownLabel('test')).toBe('test');
  });

  it('should return image type for an docker config type', () => {
    expect(typeToDropdownLabel(SecretType.dockerconfigjson)).toBe('Image pull secret');
    expect(typeToDropdownLabel(SecretType.dockercfg)).toBe('Image pull secret');
  });
  it('should return source type for an basic type', () => {
    expect(typeToDropdownLabel(SecretType.basicAuth)).toBe('Source secret');
    expect(typeToDropdownLabel(SecretType.sshAuth)).toBe('Source secret');
  });

  it('should return key/value type for an basic type', () => {
    expect(typeToDropdownLabel(SecretType.opaque)).toBe('Key/value secret');
  });
});

describe('isPartnerTaskAvailable', () => {
  it('should return true if the partner task is available for the given type', () => {
    expect(isPartnerTaskAvailable(SecretTypeDropdownLabel.opaque)).toBe(true);
  });

  it('should return false if the partner task is not available for the given type', () => {
    expect(isPartnerTaskAvailable(SecretTypeDropdownLabel.image)).toBe(false);
    expect(isPartnerTaskAvailable(SecretTypeDropdownLabel.source)).toBe(false);
  });
});

const formValues: AddSecretFormValues = {
  type: 'Key/value secret',
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
};

const formValuesForSCM: AddSecretFormValues = {
  type: 'Key/value secret',
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
    host: 'www.github.com',
    repo: 'hac-dev',
  },
};

describe('getKubernetesSecretType', () => {
  it('should return opaque secret type', () => {
    const opaqueFormValues = formValues;
    expect(getKubernetesSecretType(opaqueFormValues)).toBe('Opaque');
  });

  it('should return image secret type', () => {
    const imageDockerConfigFormValues = {
      ...formValues,
      type: SecretTypeDropdownLabel.image,
      image: { ...formValues.image, authType: ImagePullSecretType.ImageRegistryCreds },
    };
    expect(getKubernetesSecretType(imageDockerConfigFormValues)).toBe(
      'kubernetes.io/dockerconfigjson',
    );

    const uploadConfigFormValues = {
      ...formValues,
      type: SecretTypeDropdownLabel.image,
      image: { ...formValues.image, authType: ImagePullSecretType.UploadConfigFile },
    };
    expect(getKubernetesSecretType(uploadConfigFormValues)).toBe('kubernetes.io/dockercfg');
  });
  it('should return source secret type', () => {
    const sourceBasiAuthFormValues = { ...formValues, type: SecretTypeDropdownLabel.source };
    expect(getKubernetesSecretType(sourceBasiAuthFormValues)).toBe('kubernetes.io/basic-auth');

    const sshFormValues = {
      ...formValues,
      type: SecretTypeDropdownLabel.source,
      source: { ...formValues.source, authType: SourceSecretType.ssh },
    };
    expect(getKubernetesSecretType(sshFormValues)).toBe('kubernetes.io/ssh-auth');
  });
});

describe('getSecretFormData', () => {
  it('should return opaque secret resource with encoded data', () => {
    expect(getSecretFormData(formValues, 'test-ns')).toEqual(
      expect.objectContaining({
        type: 'Opaque',
        data: { test: 'dGVzdA==' },
      }),
    );
  });

  it('should return image secret resource with encoded data', () => {
    const imageFormValues = { ...formValues, type: SecretTypeDropdownLabel.image };
    expect(getSecretFormData(imageFormValues, 'test-ns')).toEqual(
      expect.objectContaining({
        type: 'kubernetes.io/dockerconfigjson',
        data: { ['.dockerconfigjson']: expect.anything() },
      }),
    );

    const dockerConfigFormValues = {
      ...formValues,
      type: SecretTypeDropdownLabel.image,
      image: {
        ...formValues.image,
        authType: ImagePullSecretType.UploadConfigFile,
        dockerconfig: 'eyJ0ZXN0IjoidGVzdCJ9Cg==',
      },
    };
    expect(getSecretFormData(dockerConfigFormValues, 'test-ns')).toEqual(
      expect.objectContaining({
        type: 'kubernetes.io/dockercfg',
        data: { ['.dockercfg']: expect.anything() },
      }),
    );
  });

  it('should return source secret resource with encoded data', () => {
    const sourceFormValues = { ...formValues, type: SecretTypeDropdownLabel.source };
    expect(getSecretFormData(sourceFormValues, 'test-ns')).toEqual(
      expect.objectContaining({
        type: 'kubernetes.io/basic-auth',
        data: { username: 'dGVzdA==', password: 'dGVzdA==' },
      }),
    );

    const sshFormValues = {
      ...formValues,
      type: SecretTypeDropdownLabel.source,
      source: {
        ...formValues.source,
        authType: SourceSecretType.ssh,
        'ssh-privatekey': 'xxxxxxx',
      },
    };
    expect(getSecretFormData(sshFormValues, 'test-ns')).toEqual(
      expect.objectContaining({
        type: 'kubernetes.io/ssh-auth',
        data: { ['ssh-privatekey']: expect.anything() },
      }),
    );
  });
});

describe('getTargetLabelsForRemoteSecret', () => {
  it('should return empty target object for remote secret', () => {
    expect(
      getTargetLabelsForRemoteSecret({
        ...formValues,
      }),
    ).toEqual({
      'ui.appstudio.redhat.com/secret-for': 'Build',
    });
  });

  it('should return correct label for build secret', () => {
    expect(
      getTargetLabelsForRemoteSecret({
        ...formValues,
        secretFor: SecretFor.Build,
      }),
    ).toEqual({
      'ui.appstudio.redhat.com/secret-for': 'Build',
    });
  });

  it('should return correct label for deployment secret', () => {
    expect(
      getTargetLabelsForRemoteSecret({
        ...formValues,
        secretFor: SecretFor.Deployment,
      }),
    ).toEqual({
      'ui.appstudio.redhat.com/secret-for': 'Deployment',
    });
  });
});

describe('getLabelsForSecret', () => {
  it('should return empty target object for remote secret', () => {
    expect(
      getLabelsForSecret({
        ...formValues,
        labels: null,
      }),
    ).toBeNull();
  });

  it('should return labels for remote secret', () => {
    expect(
      getLabelsForSecret({
        ...formValues,
        labels: [{ key: 'test', value: 'test-value' }],
      }),
    ).toEqual({
      test: 'test-value',
    });
  });

  it('should return host & scm labels for SCM secret', () => {
    expect(
      getLabelsForSecret({
        ...formValuesForSCM,
      }),
    ).toEqual({
      [SecretLabels.CREDENTIAL_LABEL]: SecretLabels.CREDENTIAL_VALUE,
      [SecretLabels.HOST_LABEL]: 'www.github.com',
    });
  });
});

describe('getAnnotationForSecret', () => {
  it('should return host & scm label', () => {
    expect(
      getLabelsForSecret({
        ...formValues,
        labels: null,
      }),
    ).toBeNull();
  });

  it('should return repo annotation for SCM remote secret', () => {
    expect(
      getAnnotationForSecret({
        ...formValuesForSCM,
      }),
    ).toEqual({
      [SecretLabels.REPO_ANNOTATION]: 'hac-dev',
    });
  });
});

describe('editSecretResource', () => {
  beforeEach(() => {
    k8sPatchResourceMock.mockReset();
    k8sPatchResourceMock.mockResolvedValue({});
  });

  it('sends labels and annotations patches as empty objects when form yields no metadata maps', async () => {
    const values: AddSecretFormValues = {
      ...formValues,
      labels: [],
      source: { authType: SourceSecretType.basic, username: 'u', password: 'p' },
    };
    await editSecretResource(values, 'test-ns');

    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(1);
    const { patches, queryOptions } = k8sPatchResourceMock.mock.calls[0][0];
    expect(queryOptions).toMatchObject({ name: 'test', ns: 'test-ns' });
    expect(patches[0]).toEqual({ op: 'add', path: '/metadata/labels', value: {} });
    expect(patches[1]).toEqual({ op: 'add', path: '/metadata/annotations', value: {} });
    expect(patches[2]).toMatchObject({ op: 'replace', path: '/data' });
    expect(patches[2].value).toEqual({ test: 'dGVzdA==' });
  });

  it('sends SCM labels and repo annotation when host and repo are set', async () => {
    await editSecretResource(formValuesForSCM, 'test-ns');

    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(1);
    const { patches } = k8sPatchResourceMock.mock.calls[0][0];
    expect(patches[0]).toEqual({
      op: 'add',
      path: '/metadata/labels',
      value: {
        [SecretLabels.CREDENTIAL_LABEL]: SecretLabels.CREDENTIAL_VALUE,
        [SecretLabels.HOST_LABEL]: 'www.github.com',
      },
    });
    expect(patches[1]).toEqual({
      op: 'add',
      path: '/metadata/annotations',
      value: { [SecretLabels.REPO_ANNOTATION]: 'hac-dev' },
    });
    expect(patches[2]).toMatchObject({ op: 'replace', path: '/data' });
  });

  it('merges user labels with SCM labels in the labels patch', async () => {
    const values: AddSecretFormValues = {
      ...formValuesForSCM,
      labels: [{ key: 'env', value: 'prod' }],
    };
    await editSecretResource(values, 'test-ns');

    const labelsPatch = k8sPatchResourceMock.mock.calls[0][0].patches[0];
    expect(labelsPatch).toEqual({
      op: 'add',
      path: '/metadata/labels',
      value: {
        env: 'prod',
        [SecretLabels.CREDENTIAL_LABEL]: SecretLabels.CREDENTIAL_VALUE,
        [SecretLabels.HOST_LABEL]: 'www.github.com',
      },
    });
  });

  it('sends only user labels when no SCM host and annotations stay empty', async () => {
    const values: AddSecretFormValues = {
      ...formValues,
      labels: [{ key: 'team', value: 'platform' }],
      source: { authType: SourceSecretType.basic, username: 'u', password: 'p' },
    };
    await editSecretResource(values, 'test-ns');

    const { patches } = k8sPatchResourceMock.mock.calls[0][0];
    expect(patches[0]).toEqual({
      op: 'add',
      path: '/metadata/labels',
      value: { team: 'platform' },
    });
    expect(patches[1]).toEqual({ op: 'add', path: '/metadata/annotations', value: {} });
  });

  it('merges existing cluster annotations with form annotations when existing secret is passed', async () => {
    const existingWithCliAnnotations = {
      ...mockSecret,
      metadata: {
        ...mockSecret.metadata,
        name: 'test',
        namespace: 'test-ns',
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration': '{"kind":"Secret"}',
          'custom.io/managed-by': 'cli',
        },
      },
    };
    await editSecretResource(formValuesForSCM, 'test-ns', existingWithCliAnnotations);

    const { patches } = k8sPatchResourceMock.mock.calls[0][0];
    expect(patches[1]).toEqual({
      op: 'add',
      path: '/metadata/annotations',
      value: {
        'kubectl.kubernetes.io/last-applied-configuration': '{"kind":"Secret"}',
        'custom.io/managed-by': 'cli',
        [SecretLabels.REPO_ANNOTATION]: 'hac-dev',
      },
    });
  });

  it('lets form-derived annotations override existing keys when both define the same key', async () => {
    const existing = {
      ...mockSecret,
      metadata: {
        ...mockSecret.metadata,
        name: 'test',
        namespace: 'test-ns',
        annotations: {
          [SecretLabels.REPO_ANNOTATION]: 'old-repo',
        },
      },
    };
    await editSecretResource(formValuesForSCM, 'test-ns', existing);

    const annotationsPatch = k8sPatchResourceMock.mock.calls[0][0].patches[1];
    expect(annotationsPatch.value[SecretLabels.REPO_ANNOTATION]).toBe('hac-dev');
  });
});

describe('patchCommonSecretLabel', () => {
  beforeEach(() => {
    k8sPatchResourceMock.mockClear();
    k8sPatchResourceMock.mockResolvedValue({
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: { name: mockSecret.metadata.name, namespace: mockSecret.metadata.namespace },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should add common secret label when add is true', async () => {
    await patchCommonSecretLabel(mockSecret, true);
    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: SecretModel,
      queryOptions: {
        name: mockSecret.metadata.name,
        ns: mockSecret.metadata.namespace,
      },
      patches: [
        {
          op: 'replace',
          path: '/metadata/labels',
          value: { [SecretLabels.COMMON_SECRET_LABEL]: 'true' },
        },
      ],
    });
  });

  it('should remove common secret label when add is false', async () => {
    const secretWithLabel = {
      ...mockSecret,
      metadata: {
        ...mockSecret.metadata,
        labels: { [SecretLabels.COMMON_SECRET_LABEL]: 'true' },
      },
    };
    await patchCommonSecretLabel(secretWithLabel, false);
    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: SecretModel,
      queryOptions: {
        name: mockSecret.metadata.name,
        ns: mockSecret.metadata.namespace,
      },
      patches: [
        {
          op: 'replace',
          path: '/metadata/labels',
          value: {},
        },
      ],
    });
  });

  it('should not call K8sQueryPatchResource if secret is invalid', async () => {
    await patchCommonSecretLabel(null, true);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });
});
