import { LoaderFunctionArgs } from 'react-router-dom';
import { groupReleaseDetailsLoader } from '~/components/Releases/groupReleaseDetailsLoader';
import { ReleaseLabel } from '~/consts/release';
import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';
import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';
import { ReleaseModel } from '~/models';
import { ReleaseKind } from '~/types';
import { ResourceSource } from '~/types/k8s';

jest.mock('~/kubearchive/resource-utils', () => ({
  fetchResourceWithK8sAndKubeArchive: jest.fn(),
}));
jest.mock('~/feature-flags/utils', () => ({ ensureFeatureFlagOnLoader: jest.fn() }));
jest.mock('~/utils/rbac', () => ({
  ...jest.requireActual('~/utils/rbac'),
  createLoaderWithAccessCheck: (loader) => loader,
}));

describe('groupReleaseDetailsLoader', () => {
  const release: ReleaseKind = {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'release-one',
      namespace: 'test-ns',
      labels: { [ReleaseLabel.COMPONENT_GROUP]: 'my-group' },
    },
    spec: { releasePlan: 'plan-one', snapshot: 'snapshot-one' },
  };
  const args: LoaderFunctionArgs = {
    request: undefined,
    params: { workspaceName: 'test-ns', groupName: 'my-group', releaseName: 'release-one' },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .mocked(fetchResourceWithK8sAndKubeArchive)
      .mockResolvedValue({ resource: release, source: ResourceSource.Cluster });
  });

  it.each([ResourceSource.Cluster, ResourceSource.Archive])(
    'loads a group release from %s using the URL namespace',
    async (source) => {
      jest
        .mocked(fetchResourceWithK8sAndKubeArchive)
        .mockResolvedValue({ resource: release, source });
      await expect(groupReleaseDetailsLoader(args)).resolves.toEqual(release);
      expect(fetchResourceWithK8sAndKubeArchive).toHaveBeenCalledWith({
        model: ReleaseModel,
        queryOptions: { ns: 'test-ns', name: 'release-one' },
      });
    },
  );

  it.each(['another-group', undefined])('rejects releases with group label %s', async (group) => {
    jest.mocked(fetchResourceWithK8sAndKubeArchive).mockResolvedValue({
      resource: {
        ...release,
        metadata: { ...release.metadata, labels: { [ReleaseLabel.COMPONENT_GROUP]: group } },
      },
      source: ResourceSource.Archive,
    });
    await expect(groupReleaseDetailsLoader(args)).rejects.toMatchObject({ code: 404 });
  });

  it('does not fetch when the component model flag is disabled', async () => {
    jest.mocked(ensureFeatureFlagOnLoader).mockImplementation(() => {
      throw new Error('Feature disabled');
    });
    await expect(groupReleaseDetailsLoader(args)).rejects.toThrow('Feature disabled');
    expect(fetchResourceWithK8sAndKubeArchive).not.toHaveBeenCalled();
  });

  it('propagates a missing or inaccessible release', async () => {
    jest.mocked(fetchResourceWithK8sAndKubeArchive).mockRejectedValue({ code: 403 });
    await expect(groupReleaseDetailsLoader(args)).rejects.toMatchObject({ code: 403 });
  });
});
