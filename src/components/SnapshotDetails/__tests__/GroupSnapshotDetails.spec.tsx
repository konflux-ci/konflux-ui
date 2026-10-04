import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SnapshotDetailsView from '~/components/SnapshotDetails/SnapshotDetailsView';
import SnapshotOverview from '~/components/SnapshotDetails/tabs/SnapshotOverview';
import { useSnapshot } from '~/hooks/useSnapshots';
import { Snapshot } from '~/types/coreBuildService';
import { ResourceSource } from '~/types/k8s';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
  setupVirtualizerMock,
} from '~/unit-test-utils';

jest.mock('~/hooks/useSnapshots', () => ({ useSnapshot: jest.fn() }));
jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunV2: () => [undefined, true] }));
jest.mock('~/hooks/useScanResults', () => ({ useScanResults: () => [undefined, true] }));
jest.mock('~/hooks/useImageRepository', () => ({ useImageRepository: () => [undefined, true] }));
jest.mock('~/hooks/useImageProxy', () => ({ useImageProxy: () => [undefined, true] }));
jest.mock('~/image-controller/conditional-checks', () => ({
  useIsImageControllerEnabled: () => ({ isImageControllerEnabled: false }),
}));
jest.mock('@tanstack/react-virtual', () => ({ useVirtualizer: jest.fn() }));
jest.mock('~/utils/rbac', () => ({
  ...jest.requireActual('~/utils/rbac'),
  useAccessReviewForModel: () => [true, true],
}));
createUseParamsMock({ groupName: 'my-group', snapshotName: 'group-snapshot' });
mockUseNamespaceHook('test-ns');
const snapshot: Snapshot = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Snapshot',
  metadata: { name: 'group-snapshot', namespace: 'test-ns' },
  spec: {
    componentGroup: 'my-group',
    components: ['v1', 'v2'].map((version) => ({
      name: 'component-a',
      version,
      containerImage: `quay.io/test/image:${version}`,
      source: { git: { url: 'https://github.com/org/repo', revision: version } },
    })),
  },
};
beforeEach(() => {
  setupVirtualizerMock();
  jest
    .mocked(useSnapshot)
    .mockReturnValue([snapshot, true, undefined, undefined, false, ResourceSource.Cluster]);
  window.history.replaceState({}, '', '/ns/test-ns/groups/my-group/snapshots/group-snapshot');
});
it('renders group breadcrumbs and read-only actions', async () => {
  const user = userEvent.setup();
  renderWithQueryClientAndRouter(<SnapshotDetailsView />);
  expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute(
    'href',
    '/ns/test-ns/groups',
  );
  expect(screen.getByRole('link', { name: 'Snapshots' })).toHaveAttribute(
    'href',
    '/ns/test-ns/groups/my-group/snapshots',
  );
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent.trim())).toEqual(['Overview']);
  await user.click(screen.getByRole('button', { name: 'Actions' }));
  expect(await screen.findByText('Download YAML')).toBeInTheDocument();
  expect(screen.queryByText('Trigger release')).not.toBeInTheDocument();
});
it('shows distinct component versions with standalone links in the overview', () => {
  renderWithQueryClientAndRouter(<SnapshotOverview />);
  expect(screen.getByRole('grid', { name: 'Snapshot components' })).toBeInTheDocument();
  expect(screen.getAllByRole('row')).toHaveLength(3);
  expect(screen.queryByRole('columnheader', { name: 'Version' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'component-a( v1)' })).toHaveAttribute(
    'href',
    '/ns/test-ns/components/component-a',
  );
  expect(screen.getByRole('link', { name: 'component-a( v2)' })).toHaveAttribute(
    'href',
    '/ns/test-ns/components/component-a',
  );
  expect(screen.getByDisplayValue('quay.io/test/image:v1')).toBeInTheDocument();
  expect(
    screen
      .getAllByRole('link')
      .every((link) => !link.getAttribute('href').includes('/applications/')),
  ).toBe(true);
});
it('uses a read-only empty state without an add-component action', () => {
  jest
    .mocked(useSnapshot)
    .mockReturnValue([
      { ...snapshot, spec: { ...snapshot.spec, components: [] } },
      true,
      undefined,
      undefined,
      false,
      ResourceSource.Archive,
    ]);
  renderWithQueryClientAndRouter(<SnapshotOverview />);
  expect(screen.getByText('No components in this snapshot')).toBeInTheDocument();
  expect(screen.queryByText('Add component')).not.toBeInTheDocument();
});
