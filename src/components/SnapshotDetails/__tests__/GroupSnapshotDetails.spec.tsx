import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import GroupSnapshotDetailsView from '~/components/SnapshotDetails/GroupSnapshotDetailsView';
import GroupSnapshotOverview from '~/components/SnapshotDetails/tabs/GroupSnapshotOverview';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { SnapshotLabels } from '~/consts/snapshots';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useScanResults } from '~/hooks/useScanResults';
import { useSnapshot } from '~/hooks/useSnapshots';
import useTriggerReleaseAction from '~/shared/hooks/useTriggerReleaseAction';
import { Snapshot } from '~/types/coreBuildService';
import { ResourceSource } from '~/types/k8s';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
  setupVirtualizerMock,
} from '~/unit-test-utils';

jest.mock('~/hooks/useSnapshots', () => ({ useSnapshot: jest.fn() }));
jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunV2: jest.fn() }));
jest.mock('~/hooks/useScanResults', () => ({ useScanResults: jest.fn() }));
jest.mock('~/shared/hooks/useTriggerReleaseAction', () => ({
  __esModule: true,
  default: jest.fn(
    jest.requireActual<typeof import('~/shared/hooks/useTriggerReleaseAction')>(
      '~/shared/hooks/useTriggerReleaseAction',
    ).default,
  ),
}));
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

describe('GroupSnapshotDetails', () => {
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
    jest.clearAllMocks();
    setupVirtualizerMock();
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, undefined]);
    jest.mocked(useScanResults).mockReturnValue([undefined, true, undefined]);
    jest
      .mocked(useSnapshot)
      .mockReturnValue([snapshot, true, undefined, undefined, false, ResourceSource.Cluster]);
    window.history.replaceState({}, '', '/ns/test-ns/groups/my-group/snapshots/group-snapshot');
  });

  it('does not check release permissions for read-only group snapshots', () => {
    renderWithQueryClientAndRouter(<GroupSnapshotDetailsView />);
    expect(useTriggerReleaseAction).not.toHaveBeenCalled();
  });

  it('renders a loading indicator while the snapshot loads', () => {
    jest
      .mocked(useSnapshot)
      .mockReturnValue([undefined, false, undefined, undefined, false, undefined]);
    renderWithQueryClientAndRouter(<GroupSnapshotDetailsView />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders a not-found error for a missing snapshot', () => {
    jest
      .mocked(useSnapshot)
      .mockReturnValue([undefined, true, { code: 404 }, undefined, false, undefined]);
    renderWithQueryClientAndRouter(<GroupSnapshotDetailsView />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });

  it('links the triggering commit externally without an application commit route', () => {
    const pipelineRun = testPipelineRuns[DataState.SUCCEEDED];
    jest.mocked(usePipelineRunV2).mockReturnValue([
      {
        ...pipelineRun,
        metadata: {
          ...pipelineRun.metadata,
          annotations: {
            ...pipelineRun.metadata.annotations,
            [PipelineRunLabel.COMMIT_URL_ANNOTATION]: 'https://github.com/org/repo/commit/abc123',
          },
        },
      },
      true,
      undefined,
    ]);
    renderWithQueryClientAndRouter(<GroupSnapshotOverview />);
    const trigger = screen.getByTestId('snapshot-commit-link');
    const links = within(trigger).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toMatch(/^https:\/\//);
  });

  it('shows a dash for vulnerabilities when there is no originating build', () => {
    jest.mocked(useScanResults).mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<GroupSnapshotOverview />);
    const vulnerabilities = screen.getByText('Vulnerabilities').closest('div');
    expect(within(vulnerabilities).getByText('-')).toBeInTheDocument();
  });

  it('shows scan results from the originating build', () => {
    jest.mocked(useSnapshot).mockReturnValue([
      {
        ...snapshot,
        metadata: {
          ...snapshot.metadata,
          labels: { [SnapshotLabels.BUILD_PIPELINE_LABEL]: 'build-1' },
        },
      },
      true,
      undefined,
      undefined,
      false,
      ResourceSource.Cluster,
    ]);
    jest
      .mocked(useScanResults)
      .mockReturnValue([
        { vulnerabilities: { critical: 1, high: 0, medium: 0, low: 0, unknown: 0 } },
        true,
        undefined,
      ]);
    renderWithQueryClientAndRouter(<GroupSnapshotOverview />);
    expect(screen.getByTestId('scan-status-critical-test-id')).toBeInTheDocument();
  });

  it('renders group breadcrumbs and read-only actions', async () => {
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<GroupSnapshotDetailsView />);
    expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute(
      'href',
      '/ns/test-ns/groups',
    );
    expect(screen.getByRole('link', { name: 'Snapshots' })).toHaveAttribute(
      'href',
      '/ns/test-ns/groups/my-group/snapshots',
    );
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent.trim())).toEqual([
      'Overview',
      'Pipeline runs',
    ]);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByText('Download YAML')).toBeInTheDocument();
    expect(screen.queryByText('Trigger release')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Pipeline runs' }));
    expect(window.location.pathname).toBe(
      '/ns/test-ns/groups/my-group/snapshots/group-snapshot/pipelineruns',
    );
  });

  it('shows distinct component versions with standalone links in the overview', () => {
    renderWithQueryClientAndRouter(<GroupSnapshotOverview />);
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
    renderWithQueryClientAndRouter(<GroupSnapshotOverview />);
    expect(screen.getByText('No components in this snapshot')).toBeInTheDocument();
    expect(screen.queryByText('Add component')).not.toBeInTheDocument();
  });
});
