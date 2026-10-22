import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ComponentGroupSnapshotsTab } from '~/components/ComponentGroups/ComponentGroupDetails/tabs/ComponentGroupSnapshotsTab';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { Snapshot } from '~/types/coreBuildService';
import { ResourceSource } from '~/types/k8s';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
  setupVirtualizerMock,
} from '~/unit-test-utils';

jest.mock('@tanstack/react-virtual', () => ({ useVirtualizer: jest.fn() }));
jest.mock('~/hooks/useK8sAndKarchResources', () => ({ useK8sAndKarchResources: jest.fn() }));
const mockSnapshots = jest.mocked(useK8sAndKarchResources);
const params = createUseParamsMock({ groupName: 'my-group' });
mockUseNamespaceHook('test-ns');
const snapshot: Snapshot = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Snapshot',
  metadata: {
    name: 'group-snapshot',
    namespace: 'test-ns',
    uid: 'snapshot-uid',
    labels: { [PipelineRunLabel.COMPONENT_GROUP]: 'my-group' },
  },
  spec: {
    componentGroup: 'my-group',
    components: [{ name: 'my-component', containerImage: 'quay.io/test/image:latest' }],
  },
};
const renderTab = (searchParams = '') =>
  renderWithQueryClientAndRouter(
    <NuqsTestingAdapter hasMemory searchParams={searchParams}>
      <ComponentGroupSnapshotsTab />
    </NuqsTestingAdapter>,
  );
const result = {
  data: [snapshot],
  getSource: () => ResourceSource.Cluster,
  isLoading: false,
  clusterLoading: false,
  archiveLoading: false,
  clusterError: undefined,
  archiveError: undefined,
  hasError: false,
  clusterData: [snapshot],
  archiveData: [],
};
beforeEach(() => {
  jest.clearAllMocks();
  setupVirtualizerMock();
  params.mockReturnValue({ groupName: 'my-group' });
  mockSnapshots.mockReturnValue(result);
});

it('scopes snapshots to the group and links components without an application', async () => {
  const user = userEvent.setup();
  renderTab();
  expect(mockSnapshots).toHaveBeenCalledWith(
    expect.objectContaining({
      namespace: 'test-ns',
      selector: { matchLabels: { [PipelineRunLabel.COMPONENT_GROUP]: 'my-group' } },
    }),
    expect.anything(),
    undefined,
    undefined,
    expect.objectContaining({ enableArchive: true }),
  );
  expect(screen.getByRole('grid', { name: 'Snapshots List' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'my-component' })).toHaveAttribute(
    'href',
    '/ns/test-ns/components/my-component',
  );
  expect(screen.getByText('group-snapshot')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'group-snapshot' })).toHaveAttribute(
    'href',
    '/ns/test-ns/groups/my-group/snapshots/group-snapshot',
  );
  await user.click(screen.getByRole('button', { name: /actions/i }));
  expect(await screen.findByText('Download YAML')).toBeInTheDocument();
  expect(screen.queryByText('Trigger release')).not.toBeInTheDocument();
});
it('does not fetch all snapshots when the group parameter is absent', () => {
  params.mockReturnValue({});
  renderTab();
  expect(mockSnapshots).toHaveBeenCalledWith(
    undefined,
    expect.anything(),
    undefined,
    undefined,
    expect.anything(),
  );
});
it('shows loading, errors, and group empty states', () => {
  mockSnapshots.mockReturnValue({ data: [], isLoading: true } as ReturnType<
    typeof useK8sAndKarchResources
  >);
  const view = renderTab();
  expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  mockSnapshots.mockReturnValue({
    ...result,
    data: [],
    isLoading: false,
    clusterError: { code: 500 },
    archiveError: { code: 500 },
  });
  view.rerender(<ComponentGroupSnapshotsTab />);
  expect(screen.getByText('Unable to load snapshots')).toBeInTheDocument();
  mockSnapshots.mockReturnValue({ data: [], isLoading: false } as ReturnType<
    typeof useK8sAndKarchResources
  >);
  view.rerender(<ComponentGroupSnapshotsTab />);
  expect(screen.getByText('No snapshots found')).toBeInTheDocument();
});
it('clears unmatched name filters', async () => {
  const user = userEvent.setup();
  renderTab('?name=missing');
  expect(screen.getByText('No results found')).toBeInTheDocument();
  await user.click(screen.getAllByRole('button', { name: 'Clear all filters' })[0]);
  expect(await screen.findByText('group-snapshot')).toBeInTheDocument();
});

it('links every component version, including those in the more popover', async () => {
  const user = userEvent.setup();
  mockSnapshots.mockReturnValue({
    ...result,
    data: [
      {
        ...snapshot,
        spec: {
          ...snapshot.spec,
          components: ['v1', 'v2', 'v3', 'v4'].map((version) => ({
            ...snapshot.spec.components[0],
            version,
          })),
        },
      },
    ],
  });
  renderTab();
  for (const version of ['v1', 'v2', 'v3']) {
    expect(screen.getByRole('link', { name: `my-component( ${version})` })).toHaveAttribute(
      'href',
      '/ns/test-ns/components/my-component',
    );
  }
  await user.click(screen.getByRole('button', { name: '1 more' }));
  expect(await screen.findByRole('link', { name: 'my-component( v4)' })).toHaveAttribute(
    'href',
    '/ns/test-ns/components/my-component',
  );
});
