import { LoaderFunctionArgs } from 'react-router-dom';
import { snapshotDetailsViewLoader } from '~/components/SnapshotDetails';
import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';
import { Snapshot } from '~/types/coreBuildService';
import { ResourceSource } from '~/types/k8s';

jest.mock('~/kubearchive/resource-utils', () => ({
  fetchResourceWithK8sAndKubeArchive: jest.fn(),
}));
jest.mock('~/utils/rbac', () => ({
  ...jest.requireActual('~/utils/rbac'),
  createLoaderWithAccessCheck: (loader) => loader,
}));
const snapshot: Snapshot = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Snapshot',
  metadata: { name: 'snap', namespace: 'test-ns' },
  spec: { componentGroup: 'my-group', components: [] },
};
const args = (groupName?: string): LoaderFunctionArgs => ({
  request: undefined,
  params: { workspaceName: 'test-ns', snapshotName: 'snap', groupName },
});
beforeEach(() =>
  jest
    .mocked(fetchResourceWithK8sAndKubeArchive)
    .mockResolvedValue({ resource: snapshot, source: ResourceSource.Cluster }),
);
it('loads a snapshot belonging to the group', async () => {
  await expect(snapshotDetailsViewLoader(args('my-group'))).resolves.toEqual(snapshot);
});
it('rejects a snapshot from a different group', async () => {
  await expect(snapshotDetailsViewLoader(args('another-group'))).rejects.toMatchObject({
    code: 404,
  });
});
it('keeps application loading unchanged', async () => {
  await expect(snapshotDetailsViewLoader(args())).resolves.toEqual(snapshot);
});
it('validates archived snapshot membership too', async () => {
  jest
    .mocked(fetchResourceWithK8sAndKubeArchive)
    .mockResolvedValue({ resource: snapshot, source: ResourceSource.Archive });
  await expect(snapshotDetailsViewLoader(args('another-group'))).rejects.toMatchObject({
    code: 404,
  });
});
