import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ComponentGroupPipelineRunsTab } from '~/components/ComponentGroups/ComponentGroupDetails/tabs/ComponentGroupPipelineRunsTab';
import { PipelineRunLabel, PipelineRunType, runStatus } from '~/consts/pipelinerun';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind } from '~/types';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
  setupVirtualizerMock,
} from '~/unit-test-utils';

jest.mock('@tanstack/react-virtual', () => ({ useVirtualizer: jest.fn() }));
jest.mock('~/hooks/useTaskRunsV2', () => ({ useTaskRunsForPipelineRuns: () => [[], true] }));
jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunsV2: jest.fn() }));
jest.mock('~/hooks/useScanResults', () => ({ useKarchScanResults: () => [null, true] }));
jest.mock('~/hooks/usePipelineRunTestOutputResult', () => ({
  usePipelineRunTestOutputResult: () => [null, false],
}));
jest.mock('~/components/PipelineRun/PipelineRunListView/pipelinerun-actions', () => ({
  usePipelinerunActionsLazy: () => [[], jest.fn()],
}));
jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  IfFeature: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUsePipelineRuns = jest.mocked(usePipelineRunsV2);
const mockParams = createUseParamsMock({ groupName: 'test-group' });
mockUseNamespaceHook('test-ns');

const runs: PipelineRunKind[] = [
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'component-build',
      namespace: 'test-ns',
      uid: 'build-uid',
      labels: {
        [PipelineRunLabel.COMPONENT_GROUP]: 'test-group',
        [PipelineRunLabel.COMPONENT]: 'my-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
      },
    },
    spec: {},
    status: {
      pipelineSpec: { tasks: [] },
      conditions: [{ type: 'Succeeded', status: 'Unknown', reason: 'Running' }],
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'integration-test',
      namespace: 'test-ns',
      uid: 'test-uid',
      labels: {
        [PipelineRunLabel.COMPONENT_GROUP]: 'test-group',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
      },
    },
    spec: {},
    status: {
      pipelineSpec: { tasks: [] },
      conditions: [{ type: 'Succeeded', status: 'False', reason: 'Failed' }],
    },
  },
];

const renderTab = (searchParams = '') =>
  renderWithQueryClientAndRouter(
    <NuqsTestingAdapter hasMemory searchParams={searchParams}>
      <ComponentGroupPipelineRunsTab />
    </NuqsTestingAdapter>,
  );

describe('ComponentGroupPipelineRunsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupVirtualizerMock();
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    mockParams.mockReturnValue({ groupName: 'test-group' });
    mockUsePipelineRuns.mockReturnValue([
      runs,
      true,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
  });

  it('fetches only the current component group and renders pipeline run columns', () => {
    renderTab();
    expect(mockUsePipelineRuns).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: {
          matchLabels: { [PipelineRunLabel.COMPONENT_GROUP]: 'test-group' },
          matchExpressions: [],
        },
      }),
    );
    expect(screen.getByRole('grid', { name: 'Pipeline runs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'component-build' })).toHaveAttribute(
      'href',
      '/ns/test-ns/pipelineruns/component-build',
    );
    expect(screen.getByRole('link', { name: 'integration-test' })).toBeInTheDocument();
    for (const header of [
      'Name',
      'Started',
      'Vulnerabilities',
      'Duration',
      'Status',
      'Test output',
      'Type',
      'Component',
      'Trigger / Reference',
    ]) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
  });

  it('does not fetch namespace-wide runs when the group is missing', () => {
    mockParams.mockReturnValue({});
    renderTab();
    expect(mockUsePipelineRuns).toHaveBeenCalledWith(null, expect.anything());
  });

  it('keeps application run links on the existing application route', () => {
    mockUsePipelineRuns.mockReturnValue([
      [
        {
          ...runs[0],
          metadata: {
            ...runs[0].metadata,
            labels: { ...runs[0].metadata.labels, [PipelineRunLabel.APPLICATION]: 'app' },
          },
        },
      ],
      true,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    renderTab();
    expect(screen.getByRole('link', { name: 'component-build' })).toHaveAttribute(
      'href',
      '/ns/test-ns/applications/app/pipelineruns/component-build',
    );
  });

  it('shows the loading state', () => {
    mockUsePipelineRuns.mockReturnValue([
      [],
      false,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    renderTab();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('grid', { name: 'Pipeline runs' })).not.toBeInTheDocument();
  });

  it('shows API errors', () => {
    mockUsePipelineRuns.mockReturnValue([
      [],
      true,
      { code: 500 },
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    renderTab();
    expect(screen.getByText('Unable to load pipeline runs')).toBeInTheDocument();
  });

  it('shows a group-specific empty state', () => {
    mockUsePipelineRuns.mockReturnValue([
      [],
      true,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    renderTab();
    expect(screen.getByText('No pipeline runs')).toBeInTheDocument();
    expect(
      screen.getByText('No pipeline runs have been created for this component group yet.'),
    ).toBeInTheDocument();
  });

  it('filters by name and clears an unmatched filter', async () => {
    const user = userEvent.setup();
    renderTab('?name=missing');
    expect(screen.getByText('No results found')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Clear all filters' })[0]);
    expect(await screen.findByRole('link', { name: 'component-build' })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'COMPONENT');
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'integration-test' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'component-build' })).toBeInTheDocument();
  });

  it('filters status using the URL state', () => {
    renderTab(`?status=${encodeURIComponent(JSON.stringify([runStatus.Running]))}`);
    expect(screen.getByRole('link', { name: 'component-build' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'integration-test' })).not.toBeInTheDocument();
  });

  it('adds type and event filters to the group selector', () => {
    renderTab('?type=%5B%22build%22%5D&eventType=%5B%22push%22%5D');
    expect(mockUsePipelineRuns).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: {
          matchLabels: { [PipelineRunLabel.COMPONENT_GROUP]: 'test-group' },
          matchExpressions: [
            { key: PipelineRunLabel.PIPELINE_TYPE, operator: 'In', values: ['build'] },
            { key: PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL, operator: 'In', values: ['push'] },
          ],
        },
      }),
    );
  });
  it('shows a clearable empty state when API filters return no runs', async () => {
    const user = userEvent.setup();
    mockUsePipelineRuns.mockReturnValue([
      [],
      true,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    renderTab('?type=%5B%22final%22%5D');
    expect(screen.getByText('No results found')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Clear all filters' })[0]);
    expect(mockUsePipelineRuns).toHaveBeenLastCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: {
          matchLabels: { [PipelineRunLabel.COMPONENT_GROUP]: 'test-group' },
          matchExpressions: [],
        },
      }),
    );
  });

  it.each(['', '?name=not-on-this-page'])(
    'keeps older runs reachable with filters %s',
    async (searchParams) => {
      const user = userEvent.setup();
      const fetchNextPage = jest.fn();
      mockUsePipelineRuns.mockReturnValue([
        runs,
        true,
        undefined,
        fetchNextPage,
        { hasNextPage: true, isFetchingNextPage: false },
      ]);
      renderTab(searchParams);
      await user.click(screen.getByRole('button', { name: 'Load more pipeline runs' }));
      expect(fetchNextPage).toHaveBeenCalledTimes(1);
    },
  );

  it('disables loading more while a page is being fetched', () => {
    mockUsePipelineRuns.mockReturnValue([
      runs,
      true,
      undefined,
      jest.fn(),
      { hasNextPage: true, isFetchingNextPage: true },
    ]);
    renderTab();
    expect(screen.getByRole('button', { name: /Load more pipeline runs/ })).toBeDisabled();
  });
});
