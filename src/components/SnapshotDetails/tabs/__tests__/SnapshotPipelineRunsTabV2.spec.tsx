import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import SnapshotPipelineRunsTabV2 from '~/components/SnapshotDetails/tabs/SnapshotPipelineRunsTabV2';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { SnapshotLabels } from '~/consts/snapshots';
import { usePipelineRunV2, usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { useSnapshot } from '~/hooks/useSnapshots';
import { PipelineRunKind } from '~/types';
import { Snapshot } from '~/types/coreBuildService';
import { ResourceSource } from '~/types/k8s';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
  setupVirtualizerMock,
} from '~/unit-test-utils';

jest.mock('@tanstack/react-virtual', () => ({ useVirtualizer: jest.fn() }));
jest.mock('~/hooks/useSnapshots', () => ({ useSnapshot: jest.fn() }));
jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: jest.fn(),
  usePipelineRunsV2: jest.fn(),
}));
jest.mock('~/hooks/useTaskRunsV2', () => ({ useTaskRunsForPipelineRuns: () => [[], true] }));
jest.mock('~/hooks/useScanResults', () => ({ useKarchScanResults: () => [undefined, true] }));

describe('SnapshotPipelineRunsTabV2', () => {
  const params = createUseParamsMock({ groupName: 'my-group', snapshotName: 'my-snapshot' });
  mockUseNamespaceHook('test-ns');
  const snapshot: Snapshot = {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Snapshot',
    metadata: {
      name: 'my-snapshot',
      namespace: 'test-ns',
      labels: { [SnapshotLabels.BUILD_PIPELINE_LABEL]: 'build-run' },
    },
    spec: { componentGroup: 'my-group', components: [] },
  };
  const build: PipelineRunKind = {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'build-run',
      namespace: 'test-ns',
      uid: 'build-uid',
      creationTimestamp: '2026-10-01T10:00:00Z',
      labels: { [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD },
    },
    spec: {},
    status: {
      pipelineSpec: { tasks: [] },
      conditions: [{ type: 'Succeeded', status: 'Unknown', reason: 'Running' }],
    },
  };
  const testRun: PipelineRunKind = {
    ...build,
    metadata: {
      ...build.metadata,
      name: 'test-run',
      uid: 'test-uid',
      creationTimestamp: '2026-10-01T11:00:00Z',
      labels: { [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST },
    },
    status: {
      pipelineSpec: { tasks: [] },
      conditions: [{ type: 'Succeeded', status: 'False', reason: 'Failed' }],
    },
  };
  const pageInfo = { hasNextPage: false, isFetchingNextPage: false };
  const renderTab = (searchParams = '') =>
    renderWithQueryClientAndRouter(
      <NuqsTestingAdapter hasMemory searchParams={searchParams}>
        <SnapshotPipelineRunsTabV2 />
      </NuqsTestingAdapter>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    setupVirtualizerMock();
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    params.mockReturnValue({ groupName: 'my-group', snapshotName: 'my-snapshot' });
    jest
      .mocked(useSnapshot)
      .mockReturnValue([snapshot, true, undefined, undefined, false, ResourceSource.Cluster]);
    jest.mocked(usePipelineRunV2).mockReturnValue([build, true, undefined]);
    jest
      .mocked(usePipelineRunsV2)
      .mockReturnValue([[testRun], true, undefined, undefined, pageInfo]);
  });

  it('merges the originating build and group/snapshot test runs, newest first, without duplicates', () => {
    jest
      .mocked(usePipelineRunsV2)
      .mockReturnValue([[testRun, build], true, undefined, undefined, pageInfo]);
    renderTab();
    expect(usePipelineRunV2).toHaveBeenCalledWith('test-ns', 'build-run');
    expect(usePipelineRunsV2).toHaveBeenCalledWith('test-ns', {
      selector: {
        matchLabels: {
          [PipelineRunLabel.COMPONENT_GROUP]: 'my-group',
          [PipelineRunLabel.SNAPSHOT]: 'my-snapshot',
        },
      },
    });
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'test-run',
      'build-run',
    ]);
    for (const name of [
      'Name',
      'Started',
      'Vulnerabilities',
      'Duration',
      'Status',
      'Type',
      'Trigger / Reference',
    ])
      expect(screen.getByRole('columnheader', { name })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Test output' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Component' })).not.toBeInTheDocument();
  });

  it.each([{ groupName: 'my-group' }, { snapshotName: 'my-snapshot' }])(
    'disables requests when route scope is incomplete: %j',
    (scope) => {
      params.mockReturnValue(scope);
      renderTab();
      expect(usePipelineRunsV2).toHaveBeenCalledWith(null, expect.anything());
      expect(usePipelineRunV2).toHaveBeenCalledWith(null, undefined);
    },
  );

  it('waits for snapshot loading before fetching runs', () => {
    jest
      .mocked(useSnapshot)
      .mockReturnValue([undefined, false, undefined, undefined, false, undefined]);
    renderTab();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(usePipelineRunsV2).toHaveBeenCalledWith(null, expect.anything());
  });

  it('rejects a snapshot outside the current group', () => {
    jest
      .mocked(useSnapshot)
      .mockReturnValue([
        { ...snapshot, spec: { ...snapshot.spec, componentGroup: 'other-group' } },
        true,
        undefined,
        undefined,
        false,
        ResourceSource.Cluster,
      ]);
    renderTab();
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    expect(usePipelineRunsV2).toHaveBeenCalledWith(null, expect.anything());
  });

  it('does not wait for an originating build when no build label exists', () => {
    jest
      .mocked(useSnapshot)
      .mockReturnValue([
        { ...snapshot, metadata: { ...snapshot.metadata, labels: {} } },
        true,
        undefined,
        undefined,
        false,
        ResourceSource.Archive,
      ]);
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, false, undefined]);
    renderTab();
    expect(screen.getByRole('link', { name: 'test-run' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'build-run' })).not.toBeInTheDocument();
  });

  it.each(['snapshot', 'build', 'test'])('shows %s fetch errors', (source) => {
    if (source === 'snapshot')
      jest
        .mocked(useSnapshot)
        .mockReturnValue([undefined, true, { code: 500 }, undefined, true, undefined]);
    if (source === 'build')
      jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, { code: 500 }]);
    if (source === 'test')
      jest
        .mocked(usePipelineRunsV2)
        .mockReturnValue([[], true, { code: 500 }, undefined, pageInfo]);
    renderTab();
    expect(
      screen.getByText(
        source === 'snapshot' ? 'Unable to load snapshot' : 'Unable to load pipeline runs',
      ),
    ).toBeInTheDocument();
  });

  it('shows a snapshot-specific empty state', () => {
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, undefined]);
    jest.mocked(usePipelineRunsV2).mockReturnValue([[], true, undefined, undefined, pageInfo]);
    renderTab();
    expect(
      screen.getByText('No pipeline runs have been created for this snapshot yet.'),
    ).toBeInTheDocument();
  });

  it('applies the type filter to the merged build and test runs', () => {
    renderTab('?type=%5B%22test%22%5D');
    expect(screen.getByRole('link', { name: 'test-run' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'build-run' })).not.toBeInTheDocument();
  });

  it('applies status and name filters to both data sources', async () => {
    const user = userEvent.setup();
    renderTab('?name=missing&status=%5B%22Running%22%5D');
    expect(screen.getByText('No results found')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Clear all filters' })[0]);
    expect(await screen.findByRole('link', { name: 'build-run' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'test-run' })).toBeInTheDocument();
  });

  it('offers only YAML download and leaves pagination to Table', async () => {
    const user = userEvent.setup();
    jest
      .mocked(usePipelineRunsV2)
      .mockReturnValue([[testRun], true, undefined, jest.fn(), { ...pageInfo, hasNextPage: true }]);
    renderTab();
    await user.click(screen.getAllByRole('button', { name: 'Actions' })[0]);
    expect(await screen.findByText('Download YAML')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: /Load more pipeline runs/ }),
    ).not.toBeInTheDocument();
  });
});
