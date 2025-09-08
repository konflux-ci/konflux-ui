import { SecretModel, ServiceAccountModel } from '../../../../models';
import { SecretKind, SecretType } from '../../../../types';
import { createK8sUtilMock } from '../../../../utils/test-utils';
import { mockSecret } from '../../__data__/mock-secrets';
import { SecretForComponentOption } from '../secret-utils';
import {
  linkCommonSecretsToServiceAccount,
  linkSecretToServiceAccounts,
  linkSecretToBuildServiceAccount,
  unLinkSecretFromBuildServiceAccount,
  isLinkableSecret,
  updateAnnotateForSecret,
} from '../service-account-utils';

const imagePullSecret = {
  apiVersion: 'v1',
  kind: 'secret',
  metadata: { name: 'test-secret' },
  type: SecretType.dockerconfigjson,
};

const imagePullSecretWithNamespace = {
  ...imagePullSecret,
  metadata: { ...imagePullSecret.metadata, namespace: 'test-ns' },
};

const testComponent = {
  apiVersion: 'v1',
  kind: 'component',
  metadata: { name: 'test-component', namespace: 'test-ns' },
  spec: {
    application: 'jira-unfurl-bot-saas-main',
    componentName: 'test-component',
    containerImage:
      'quay.io/redhat-user-workloads/assisted-installer-tenant/jira-unfurl-bot-saas-main/jira-unfurl-bot-saas-main@sha256:c627197223e03873d7b9',
  },
};

const testComponents = [
  testComponent,
  { ...testComponent, metadata: { ...testComponent.metadata, name: 'test-component-2' } },
];

const testComponentsNames = [testComponent.metadata.name, 'test-component-2'];

const testSecrets = [
  imagePullSecretWithNamespace,
  {
    ...imagePullSecretWithNamespace,
    metadata: { ...imagePullSecretWithNamespace.metadata, name: 'test-secret-2' },
  },
] as SecretKind[];

const k8sPatchResourceMock = createK8sUtilMock('K8sQueryPatchResource');
const k8sGetResourceMock = createK8sUtilMock('K8sGetResource');
const K8sListResourceItemsMock = createK8sUtilMock('K8sListResourceItems');

describe('isLinkableSecret', () => {
  it('should return true for dockerjson/dockercfg/basicAuth', () => {
    for (const validType of [
      SecretType.dockercfg,
      SecretType.dockerconfigjson,
      SecretType.basicAuth,
    ]) {
      const validSecret = { ...imagePullSecret, type: validType };
      expect(isLinkableSecret(validSecret)).toBe(true);
    }
  });

  it('should return false for invalid secret types', () => {
    for (const invalidType of [
      SecretType.opaque,
      SecretType.sshAuth,
      SecretType.tls,
      SecretType.serviceAccountToken,
    ]) {
      const invalidSecret = { ...imagePullSecret, type: invalidType };
      expect(isLinkableSecret(invalidSecret)).toBe(false);
    }
  });

  it('should return false when secret is undefined', () => {
    expect(isLinkableSecret(undefined)).toBe(false);
  });
});

describe('linkSecretToBuildServiceAccount', () => {
  beforeEach(() => {
    k8sGetResourceMock.mockReturnValue({
      metadata: { name: 'test-cdq' },
      imagePullSecrets: [
        { name: 'ip-secret1' },
        { name: 'ip-secret2' },
        { name: 'ip-secret3' },
        { name: 'ip-secret4' },
      ],
      secrets: [{ name: 'secret1' }, { name: 'secret2' }],
    });
  });

  it('should return early if no component ', async () => {
    jest.clearAllMocks();
    await linkSecretToBuildServiceAccount(imagePullSecretWithNamespace, null);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should call k8sPatchResource and create an imagePull entry', async () => {
    k8sPatchResourceMock.mockClear();
    k8sGetResourceMock.mockReturnValueOnce({
      metadata: { name: 'test-cdq' },
      imagePullSecrets: [],
      secrets: [],
    });
    await linkSecretToBuildServiceAccount(imagePullSecretWithNamespace, testComponent);
    expect(k8sPatchResourceMock).toHaveBeenCalled();
    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: ServiceAccountModel,
        patches: [
          {
            op: 'replace',
            path: '/imagePullSecrets',
            value: [{ name: 'test-secret' }],
          },
          {
            op: 'replace',
            path: '/secrets',
            value: [{ name: 'test-secret' }],
          },
        ],
      }),
    );
  });

  it('should append to imagePull secrets list ', async () => {
    k8sPatchResourceMock.mockClear();
    await linkSecretToBuildServiceAccount(imagePullSecretWithNamespace, testComponent);
    expect(k8sPatchResourceMock).toHaveBeenCalled();
    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: ServiceAccountModel,
        patches: [
          {
            op: 'replace',
            path: '/imagePullSecrets',
            value: [
              { name: 'ip-secret1' },
              { name: 'ip-secret2' },
              { name: 'ip-secret3' },
              { name: 'ip-secret4' },
              { name: 'test-secret' },
            ],
          },
          {
            op: 'replace',
            path: '/secrets',
            value: [{ name: 'secret1' }, { name: 'secret2' }, { name: 'test-secret' }],
          },
        ],
      }),
    );
  });

  it('should create new array for empty list', async () => {
    k8sGetResourceMock.mockReturnValue({
      metadata: { name: 'test-cdq' },
    });
    k8sPatchResourceMock.mockClear();
    await linkSecretToBuildServiceAccount(imagePullSecretWithNamespace, testComponent);
    expect(k8sPatchResourceMock).toHaveBeenCalled();
    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: ServiceAccountModel,
        patches: [
          {
            op: 'replace',
            path: '/imagePullSecrets',
            value: [{ name: 'test-secret' }],
          },
          {
            op: 'replace',
            path: '/secrets',
            value: [{ name: 'test-secret' }],
          },
        ],
      }),
    );
  });
});

describe('UnLinkSecretFromBuildServiceAccount', () => {
  beforeEach(() => {
    k8sGetResourceMock.mockReturnValue({
      metadata: { name: 'test-cdq' },
      imagePullSecrets: [
        { name: 'ip-secret1' },
        { name: 'ip-secret2' },
        { name: 'ip-secret3' },
        { name: 'ip-secret4' },
      ],
      secrets: [{ name: 'secret1' }, { name: 'secret2' }],
    });
  });
  it('should return early if no namespace ', async () => {
    k8sPatchResourceMock.mockClear();
    await unLinkSecretFromBuildServiceAccount(imagePullSecret, null);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should return early if no secrets array in service account ', async () => {
    k8sGetResourceMock.mockReturnValue({
      metadata: { name: 'test-cdq' },
    });
    k8sPatchResourceMock.mockClear();
    await unLinkSecretFromBuildServiceAccount(imagePullSecret, null);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should return [] when no resources found ', async () => {
    k8sGetResourceMock.mockReturnValue({
      metadata: { name: 'test-cdq' },
      imagePullSecrets: [{ name: 'random-secret' }],
      secrets: [],
    });
    k8sPatchResourceMock.mockClear();
    await unLinkSecretFromBuildServiceAccount(
      {
        metadata: { name: 'ip-secret3', namespace: 'test-ns' },
        type: imagePullSecret.type,
        kind: imagePullSecret.kind,
        apiVersion: imagePullSecret.apiVersion,
      },
      testComponent,
    );
    expect(k8sPatchResourceMock).toHaveBeenCalled();
    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: ServiceAccountModel,
        patches: [
          {
            op: 'replace',
            path: '/imagePullSecrets',
            value: [{ name: 'random-secret' }],
          },
          {
            op: 'replace',
            path: '/secrets',
            value: [],
          },
        ],
      }),
    );
  });

  it('should remove correct imagePull secrets list ', async () => {
    k8sPatchResourceMock.mockClear();
    await unLinkSecretFromBuildServiceAccount(
      {
        metadata: { name: 'ip-secret3', namespace: 'test-ns' },
        type: imagePullSecret.type,
        kind: imagePullSecret.kind,
        apiVersion: imagePullSecret.apiVersion,
      },
      testComponent,
    );
    expect(k8sPatchResourceMock).toHaveBeenCalled();
    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: ServiceAccountModel,
        patches: [
          {
            op: 'replace',
            path: '/imagePullSecrets',
            value: [{ name: 'ip-secret1' }, { name: 'ip-secret2' }, { name: 'ip-secret4' }],
          },
          {
            op: 'replace',
            path: '/secrets',
            value: [{ name: 'secret1' }, { name: 'secret2' }],
          },
        ],
      }),
    );
  });
});

describe('linkCommonSecretsToServiceAccount', () => {
  beforeEach(() => {
    k8sPatchResourceMock.mockClear();
    K8sListResourceItemsMock.mockReturnValue(testSecrets);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return early if there is no component', async () => {
    k8sPatchResourceMock.mockClear();
    await linkCommonSecretsToServiceAccount(null);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should return early if the component has no namespace', async () => {
    await linkCommonSecretsToServiceAccount({
      ...testComponent,
      metadata: { ...testComponent.metadata, namespace: null },
    });
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should return early there is no common secret ', async () => {
    K8sListResourceItemsMock.mockReturnValue([]);
    await linkCommonSecretsToServiceAccount(testComponent);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should call linkSecretToServiceAccount for each secret', async () => {
    K8sListResourceItemsMock.mockReturnValue(testSecrets);
    await linkCommonSecretsToServiceAccount(testComponent);
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(testSecrets.length);
  });
});

describe('linkSecretToAllServiceAccounts', () => {
  afterEach(() => {
    jest.clearAllMocks();
    k8sPatchResourceMock.mockClear();
  });

  it('should call linkSecretToServiceAccounts for each component', async () => {
    K8sListResourceItemsMock.mockReturnValue(testComponents);
    await linkSecretToServiceAccounts(
      imagePullSecretWithNamespace,
      [], // when select all components, we do not need relatedComponents
      SecretForComponentOption.all,
    );
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(testComponentsNames.length);
  });

  it('should call linkSecretToServiceAccounts for selected component', async () => {
    const selectedComponentsNames = [testComponent.metadata.name];
    K8sListResourceItemsMock.mockReturnValue([
      testComponent,
      { ...testComponent, metadata: { ...testComponent.metadata, name: 'test-component-2' } },
    ]);
    await linkSecretToServiceAccounts(
      imagePullSecretWithNamespace,
      selectedComponentsNames,
      SecretForComponentOption.partial,
    );
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(selectedComponentsNames.length);
  });

  it('should return early if secret is invalid', async () => {
    await linkSecretToServiceAccounts(null, testComponentsNames, SecretForComponentOption.partial);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should return early if components is invalid', async () => {
    await linkSecretToServiceAccounts(
      imagePullSecretWithNamespace,
      null,
      SecretForComponentOption.partial,
    );
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should return early if secret has no namespace', async () => {
    const invalidSecret = { metadata: { name: 'test-secret' } } as SecretKind;
    await linkSecretToServiceAccounts(
      invalidSecret,
      testComponentsNames,
      SecretForComponentOption.partial,
    );
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });
});

describe('annotateSecretWithError', () => {
  const LINKING_ERROR_ANNOTATION = 'konflux-ui/linking-secret-action-error';
  const annotationPath = `/metadata/annotations/${LINKING_ERROR_ANNOTATION.replace(/\//g, '~1')}`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add annotation if not present', async () => {
    const errorMessage = 'Link failed';

    await updateAnnotateForSecret(mockSecret, LINKING_ERROR_ANNOTATION, errorMessage);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: SecretModel,
      queryOptions: {
        name: 'my-secret',
        ns: 'my-namespace',
      },
      patches: [
        {
          op: 'add',
          path: '/metadata/annotations',
          value: {
            'konflux-ui/linking-secret-action-error': 'Link failed',
          },
        },
      ],
    });
  });

  it('should replace annotation if already present', async () => {
    const secretWithAnnotation: SecretKind = {
      ...mockSecret,
      metadata: {
        ...mockSecret.metadata,
        annotations: {
          [LINKING_ERROR_ANNOTATION]: 'old message',
        },
      },
    };
    const newErrorMessage = 'Updated failure message';

    await updateAnnotateForSecret(secretWithAnnotation, LINKING_ERROR_ANNOTATION, newErrorMessage);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: SecretModel,
      queryOptions: {
        name: 'my-secret',
        ns: 'my-namespace',
      },
      patches: [
        {
          op: 'replace',
          path: annotationPath,
          value: newErrorMessage,
        },
      ],
    });
  });
});
