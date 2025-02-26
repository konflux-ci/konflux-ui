import { ServiceAccountModel } from '../../../../models';
import { SecretType } from '../../../../types';
import { createK8sUtilMock } from '../../../../utils/test-utils';
import {
  linkSecretToServiceAccount,
  unLinkSecretFromServiceAccount,
} from '../service-account-utils';

const imagePullSecret = {
  apiVersion: 'v1',
  kind: 'secret',
  metadata: { name: 'test-secret' },
  type: SecretType.dockerconfigjson,
};

const k8sPatchResourceMock = createK8sUtilMock('K8sQueryPatchResource');
const k8sGetResourceMock = createK8sUtilMock('K8sGetResource');

describe('linkSecretToServiceAccount', () => {
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
    await linkSecretToServiceAccount(imagePullSecret, null);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should call k8sPatchResource and create an imagePull entry', async () => {
    k8sPatchResourceMock.mockClear();
    k8sGetResourceMock.mockReturnValueOnce({
      metadata: { name: 'test-cdq' },
      imagePullSecrets: [],
      secrets: [],
    });
    await linkSecretToServiceAccount(imagePullSecret, 'test-ns');
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
    await linkSecretToServiceAccount(imagePullSecret, 'test-ns');
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
    await linkSecretToServiceAccount(imagePullSecret, 'test-ns');
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

describe('UnLinkSecretFromServiceAccount', () => {
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
    await unLinkSecretFromServiceAccount(imagePullSecret, null, null);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should return early if no secrets array in service account ', async () => {
    k8sGetResourceMock.mockReturnValue({
      metadata: { name: 'test-cdq' },
    });
    k8sPatchResourceMock.mockClear();
    await unLinkSecretFromServiceAccount(imagePullSecret, null, null);
    expect(k8sPatchResourceMock).not.toHaveBeenCalled();
  });

  it('should return [] when no resources found ', async () => {
    k8sGetResourceMock.mockReturnValue({
      metadata: { name: 'test-cdq' },
      imagePullSecrets: [{ name: 'random-secret' }],
      secrets: [],
    });
    k8sPatchResourceMock.mockClear();
    await unLinkSecretFromServiceAccount(
      {
        metadata: { name: 'ip-secret3' },
        type: imagePullSecret.type,
        kind: imagePullSecret.kind,
        apiVersion: imagePullSecret.apiVersion,
      },
      'test-ns',
      'test-ws',
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
    await unLinkSecretFromServiceAccount(
      {
        metadata: { name: 'ip-secret3' },
        type: imagePullSecret.type,
        kind: imagePullSecret.kind,
        apiVersion: imagePullSecret.apiVersion,
      },
      'test-ns',
      'test-ws',
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
