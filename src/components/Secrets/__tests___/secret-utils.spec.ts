import {
  AddSecretFormValues,
  ImagePullSecretType,
  RemoteSecretStatusReason,
  SecretFor,
  SecretLabels,
  SecretType,
  SecretTypeDropdownLabel,
  SourceSecretType,
} from '../../../types';
import { createK8sUtilMock } from '../../../utils/test-utils';
import {
  createSecretResource,
  getAnnotationForSecret,
  getKubernetesSecretType,
  getLabelsForSecret,
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
} from '../utils/secret-utils';
import { sampleImagePullSecret, sampleOpaqueSecret, sampleRemoteSecrets } from './secret-data';

const createResourceMock = createK8sUtilMock('K8sQueryCreateResource');

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
  it('should create Opaque secret resource', async () => {
    await createSecretResource(sampleOpaqueSecret, 'test-ns', 'test-ws', false);

    expect(createResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: expect.objectContaining({
          kind: 'Secret',
          type: 'Opaque',
        }),
      }),
    );
  });
  it('should create Image pull secret resource', async () => {
    await createSecretResource(sampleImagePullSecret, 'test-ns', 'test-ws', false);

    expect(createResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: expect.objectContaining({
          kind: 'Secret',
          type: 'kubernetes.io/dockerconfigjson',
        }),
      }),
    );
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
