import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { MINTMAKER_NAMESPACE } from '~/consts/constants';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useComponent } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';
import { DependencyRunsListView } from '../DependencyRunsListView';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

jest.mock('~/components/LogViewer/MintmakerLogViewer', () => ({
  useMintmakerLogViewerModal: jest.fn(() => jest.fn()),
}));

const useComponentMock = useComponent as jest.Mock;
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

mockUseNamespaceHook('test-ns');

const mockComponentData = {
  metadata: {
    name: 'test-component',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
};

const makePipelineRun = (
  name: string,
  overrides: Partial<PipelineRunKind> = {},
): PipelineRunKind => ({
  kind: 'PipelineRun',
  apiVersion: 'tekton.dev/v1beta1',
  metadata: {
    name,
    namespace: 'test-ns',
    creationTimestamp: '2023-01-01T00:00:00Z',
    uid: `uid-${name}`,
  },
  spec: {},
  status: {
    conditions: [{ status: 'True', type: 'Succeeded' }],
    startTime: '2023-01-01T00:00:00Z',
    completionTime: '2023-01-01T00:05:00Z',
  } as PipelineRunStatus,
  ...overrides,
});

const mockRuns: PipelineRunKind[] = [
  makePipelineRun('dependency-run-alpha'),
  makePipelineRun('dependency-run-beta'),
];

const noNextPage = { isFetchingNextPage: false, hasNextPage: false };

const TestedComponent = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <DependencyRunsListView componentName="test-component" />
  </NuqsTestingAdapter>
);

describe('DependencyRunsListView', () => {
  beforeEach(() => {
    setupVirtualizerMock();
    useComponentMock.mockReturnValue([mockComponentData, true, undefined]);
    usePipelineRunsV2Mock.mockReturnValue([mockRuns, true, null, jest.fn(), noNextPage]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton while data is not loaded', () => {
    usePipelineRunsV2Mock.mockReturnValue([[], false, null, jest.fn(), noNextPage]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByTestId('table-container')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('renders empty state when no runs exist and no filters are active', () => {
    usePipelineRunsV2Mock.mockReturnValue([[], true, null, jest.fn(), noNextPage]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('No dependency update runs yet')).toBeVisible();
  });

  it('renders pipeline run rows when data is available', async () => {
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => {
      expect(screen.getByText('dependency-run-alpha')).toBeInTheDocument();
      expect(screen.getByText('dependency-run-beta')).toBeInTheDocument();
    });
  });

  it('renders error state when pipeline runs error occurs', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      new Error('500: Internal server error'),
      jest.fn(),
      noNextPage,
    ]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
  });

  it('renders error state when component error occurs', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('404: Not found')]);
    usePipelineRunsV2Mock.mockReturnValue([[], false, null, jest.fn(), noNextPage]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
  });

  it('shows the filter toolbar', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(screen.queryByTestId('filter-toolbar')).toBeInTheDocument();
  });

  it('does not fetch pipeline runs until the component is loaded', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClient(<TestedComponent />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(null, expect.anything());
  });

  it('does not fetch pipeline runs when component has an error', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('Not found')]);
    renderWithQueryClient(<TestedComponent />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(null, expect.anything());
  });

  it('shows loading skeleton rows while fetching the next page', async () => {
    usePipelineRunsV2Mock.mockReturnValue([
      mockRuns,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: true, hasNextPage: true },
    ]);
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => {
      expect(screen.getAllByTestId('table-loading-more').length).toBeGreaterThan(0);
    });
  });

  it('shows filtered empty state when active filters yield no results', () => {
    renderWithQueryClient(<TestedComponent searchParams="?status=%5B%22no-match-xyz%22%5D" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('fetches pipeline runs from MINTMAKER_NAMESPACE when component is loaded', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(MINTMAKER_NAMESPACE, expect.anything());
  });

  it('passes MintMaker component and namespace labels as matchLabels to usePipelineRunsV2', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: 'test-component',
            [PipelineRunLabel.MINTMAKER_NAMESPACE_LABEL]: 'test-ns',
          }),
        }),
      }),
    );
  });
});
