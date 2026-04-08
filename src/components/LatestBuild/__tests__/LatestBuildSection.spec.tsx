import { screen } from '@testing-library/react';
import { useLatestBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { ComponentKind, PipelineRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { getCommitsFromPLRs } from '~/utils/commits-utils';
import LatestBuildSection from '../LatestBuildSection';

jest.mock('~/hooks/useLatestPushBuildPipeline', () => ({
  useLatestBuildPipelineRunForComponentV2: jest.fn(),
}));

jest.mock('~/utils/commits-utils', () => ({
  getCommitsFromPLRs: jest.fn(),
}));

jest.mock('../../Commits/commit-label/CommitLabel', () => {
  return ({ sha, shaURL, gitProvider }: { sha: string; shaURL: string; gitProvider: string }) => (
    <a href={shaURL} data-test={`commit-label-mock`}>
      {gitProvider}:{sha.slice(0, 7)}
    </a>
  );
});

const useLatestBuildMock = useLatestBuildPipelineRunForComponentV2 as jest.Mock;
const getCommitsFromPLRsMock = getCommitsFromPLRs as jest.Mock;

const mockComponent = {
  metadata: {
    name: 'my-component',
    namespace: 'test-ns',
    uid: 'comp-uid',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {
    source: { url: 'https://github.com/org/repo' },
    containerImage: 'quay.io/org/repo',
  },
} as unknown as ComponentKind;

const mockPipelineRun = {
  metadata: {
    name: 'my-component-on-push-abc123',
    namespace: 'test-ns',
    uid: 'plr-uid',
  },
  status: {
    conditions: [{ type: 'Succeeded', status: 'True' }],
  },
} as unknown as PipelineRunKind;

const mockCommit = {
  sha: '3f8605c9a1b2e4d6f0123456789abcdef0123456',
  shaURL: 'https://github.com/org/repo/commit/3f8605c9a1b2e4d6f0123456789abcdef0123456',
  shaTitle: 'Red Hat Konflux update',
  gitProvider: 'github',
  isPullRequest: true,
  pullRequestNumber: '40',
};

describe('LatestBuildSection', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render a spinner while loading', () => {
    useLatestBuildMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClient(<LatestBuildSection component={mockComponent} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render an error state when pipeline run fetch fails', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, { code: 500 }]);
    renderWithQueryClient(<LatestBuildSection component={mockComponent} />);
    expect(screen.getByText('Unable to load pipeline run')).toBeInTheDocument();
  });

  it('should render an info alert when no build pipeline exists', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, undefined]);
    renderWithQueryClient(<LatestBuildSection component={mockComponent} />);
    expect(screen.getByText('No build pipeline available')).toBeInTheDocument();
  });

  it('should render commit info and pipeline run on success', () => {
    useLatestBuildMock.mockReturnValue([mockPipelineRun, true, undefined]);
    getCommitsFromPLRsMock.mockReturnValue([mockCommit]);

    renderWithQueryClient(<LatestBuildSection component={mockComponent} />);

    // commit section
    expect(screen.getByText(/Red Hat Konflux update/)).toBeInTheDocument();
    expect(screen.getByText(/#40/)).toBeInTheDocument();
    expect(screen.getByTestId('commit-label-mock')).toBeInTheDocument();

    // pipeline run section
    expect(screen.getByText('my-component-on-push-abc123')).toBeInTheDocument();
    expect(screen.getByText('Succeeded')).toBeInTheDocument();
  });

  it('should render "-" for commit when getCommitsFromPLRs returns empty', () => {
    useLatestBuildMock.mockReturnValue([mockPipelineRun, true, undefined]);
    getCommitsFromPLRsMock.mockReturnValue([]);

    renderWithQueryClient(<LatestBuildSection component={mockComponent} />);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('my-component-on-push-abc123')).toBeInTheDocument();
  });

  it('should not render PR number for non-PR commits', () => {
    const pushCommit = { ...mockCommit, isPullRequest: false, pullRequestNumber: '' };
    useLatestBuildMock.mockReturnValue([mockPipelineRun, true, undefined]);
    getCommitsFromPLRsMock.mockReturnValue([pushCommit]);

    renderWithQueryClient(<LatestBuildSection component={mockComponent} />);

    expect(screen.queryByText(/#40/)).not.toBeInTheDocument();
    expect(screen.getByText(/Red Hat Konflux update/)).toBeInTheDocument();
  });

  it('should not render CommitLabel when shaURL is missing', () => {
    const commitWithoutURL = { ...mockCommit, shaURL: '' };
    useLatestBuildMock.mockReturnValue([mockPipelineRun, true, undefined]);
    getCommitsFromPLRsMock.mockReturnValue([commitWithoutURL]);

    renderWithQueryClient(<LatestBuildSection component={mockComponent} />);

    expect(screen.queryByTestId('commit-label-mock')).not.toBeInTheDocument();
    expect(screen.getByText(/Red Hat Konflux update/)).toBeInTheDocument();
  });

  it('should pass component name to the hook', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, undefined]);
    renderWithQueryClient(<LatestBuildSection component={mockComponent} />);
    expect(useLatestBuildMock).toHaveBeenCalledWith('test-ns', 'my-component', undefined);
  });

  it('should pass version to the hook when provided', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, undefined]);
    renderWithQueryClient(<LatestBuildSection component={mockComponent} version="ver-1.0" />);
    expect(useLatestBuildMock).toHaveBeenCalledWith('test-ns', 'my-component', 'ver-1.0');
  });
});
