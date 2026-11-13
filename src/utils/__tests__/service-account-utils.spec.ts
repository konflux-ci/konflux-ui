import { mockSecret } from '~/components/Secrets/__data__/mock-secrets';
import { PIPELINE_SERVICE_ACCOUNT_PREFIX } from '~/consts/pipeline';
import { isFeatureFlagOn } from '~/feature-flags/utils';
import { HttpError } from '~/k8s/error';
import { ComponentModel, ComponentModelV2, SecretModel, ServiceAccountModel } from '~/models';
import { SecretKind, SecretType } from '~/types';
import { SecretForComponentOption } from '~/utils/secrets/secret-utils';
import {
  linkCommonSecretsToServiceAccount,
  linkSecretToServiceAccounts,
  linkSecretToBuildServiceAccount,
  unLinkSecretFromBuildServiceAccount,
  unlinkSecretFromServiceAccounts,
  isLinkableSecret,
  updateAnnotateForSecret,
} from '~/utils/service-account/service-account-utils';
import { createK8sUtilMock } from '~/utils/test-utils';

jest.mock('~/feature-flags/utils', () => ({
  isFeatureFlagOn: jest.fn(),
}));

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
const isFeatureFlagOnMock = isFeatureFlagOn as jest.Mock;

// linkSecretToServiceAccounts lists both component models; return components
// for the legacy model only so the list isn't doubled.
const mockListComponentItems = (components: unknown[]) =>
  K8sListResourceItemsMock.mockImplementation(({ model }) =>
    Promise.resolve(model === ComponentModelV2 ? [] : components),
  );

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
    mockListComponentItems(testComponents);
    await linkSecretToServiceAccounts(
      imagePullSecretWithNamespace,
      [], // when select all components, we do not need relatedComponents
      SecretForComponentOption.all,
    );
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(testComponentsNames.length);
  });

  it('should call linkSecretToServiceAccounts for selected component', async () => {
    const selectedComponentsNames = [testComponent.metadata.name];
    mockListComponentItems([
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

describe('listAllComponentsBothModels (via linkSecretToServiceAccounts)', () => {
  const v2OnlyComponent = {
    ...testComponent,
    metadata: { ...testComponent.metadata, name: 'test-component-v2-only' },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not list V2 components when the component-model flag is off', async () => {
    isFeatureFlagOnMock.mockReturnValue(false);
    mockListComponentItems(testComponents);
    await linkSecretToServiceAccounts(
      imagePullSecretWithNamespace,
      [],
      SecretForComponentOption.all,
    );
    expect(K8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(K8sListResourceItemsMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: ComponentModel }),
    );
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(testComponents.length);
  });

  it('should list both models and dedupe by name when the flag is on', async () => {
    isFeatureFlagOnMock.mockReturnValue(true);
    K8sListResourceItemsMock.mockImplementation(({ model }) =>
      Promise.resolve(
        model === ComponentModelV2 ? [...testComponents, v2OnlyComponent] : testComponents,
      ),
    );
    await linkSecretToServiceAccounts(
      imagePullSecretWithNamespace,
      [],
      SecretForComponentOption.all,
    );
    expect(K8sListResourceItemsMock).toHaveBeenCalledTimes(2);
    // shared components exist in both models but are linked only once
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(testComponents.length + 1);
  });

  it('should treat a 404 (missing CRD) from the V2 list as empty', async () => {
    isFeatureFlagOnMock.mockReturnValue(true);
    K8sListResourceItemsMock.mockImplementation(({ model }) =>
      model === ComponentModelV2
        ? Promise.reject(HttpError.fromCode(404))
        : Promise.resolve(testComponents),
    );
    await linkSecretToServiceAccounts(
      imagePullSecretWithNamespace,
      [],
      SecretForComponentOption.all,
    );
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(testComponents.length);
  });

  it('should propagate a denied (403) V2 list instead of treating it as empty', async () => {
    isFeatureFlagOnMock.mockReturnValue(true);
    K8sListResourceItemsMock.mockImplementation(({ model }) =>
      model === ComponentModelV2
        ? Promise.reject(HttpError.fromCode(403))
        : Promise.resolve(testComponents),
    );
    await expect(
      linkSecretToServiceAccounts(imagePullSecretWithNamespace, [], SecretForComponentOption.all),
    ).rejects.toThrow();
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });
});

describe('unlinkSecretFromServiceAccounts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should unlink from SA-derived components without listing V2 when the flag is off', async () => {
    isFeatureFlagOnMock.mockReturnValue(false);
    K8sListResourceItemsMock.mockImplementation(({ model }) => {
      if (model === ServiceAccountModel) {
        return Promise.resolve([
          {
            metadata: { name: `${PIPELINE_SERVICE_ACCOUNT_PREFIX}${testComponent.metadata.name}` },
            secrets: [{ name: 'test-secret' }],
          },
        ]);
      }
      return Promise.resolve(model === ComponentModelV2 ? [] : testComponents);
    });
    await unlinkSecretFromServiceAccounts(imagePullSecretWithNamespace);
    expect(K8sListResourceItemsMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: ComponentModel }),
    );
    expect(K8sListResourceItemsMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ model: ComponentModelV2 }),
    );
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(1);
  });

  it('should list both models and dedupe by name when the flag is on', async () => {
    const v2OnlyComponent = {
      ...testComponent,
      metadata: { ...testComponent.metadata, name: 'test-component-v2-only' },
    };
    isFeatureFlagOnMock.mockReturnValue(true);
    K8sListResourceItemsMock.mockImplementation(({ model }) => {
      if (model === ServiceAccountModel) {
        return Promise.resolve([
          {
            metadata: { name: `${PIPELINE_SERVICE_ACCOUNT_PREFIX}${testComponent.metadata.name}` },
            secrets: [{ name: 'test-secret' }],
          },
        ]);
      }
      return Promise.resolve(
        model === ComponentModelV2 ? [...testComponents, v2OnlyComponent] : testComponents,
      );
    });
    await unlinkSecretFromServiceAccounts(imagePullSecretWithNamespace);
    expect(K8sListResourceItemsMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: ComponentModelV2 }),
    );
    // shared component exists in both models but is unlinked only once
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(1);
  });

  it('should unlink only the given components when a list is provided', async () => {
    isFeatureFlagOnMock.mockReturnValue(false);
    mockListComponentItems(testComponents);
    await unlinkSecretFromServiceAccounts(imagePullSecretWithNamespace, 'test-ns', [
      testComponent.metadata.name,
    ]);

    // the SA auto-discovery list is skipped when components are given
    expect(K8sListResourceItemsMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ model: ServiceAccountModel }),
    );
    expect(k8sGetResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: ServiceAccountModel,
        queryOptions: {
          name: `${PIPELINE_SERVICE_ACCOUNT_PREFIX}${testComponent.metadata.name}`,
          ns: 'test-ns',
        },
      }),
    );
    expect(k8sPatchResourceMock).toHaveBeenCalledTimes(1);
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
