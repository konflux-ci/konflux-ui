import { screen } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useLatestPushBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { PipelineRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { getCommitsFromPLRs } from '~/utils/commits-utils';
import LatestPushBuildSection from '../LatestPushBuildSection';

jest.mock('~/hooks/useLatestPushBuildPipeline', () => ({
  useLatestPushBuildPipelineRunForComponentV2: jest.fn(),
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

jest.mock('../../PipelineRun/PipelineRunStatus', () => {
  return ({ pipelineRun }: { pipelineRun: PipelineRunKind }) => (
    <span data-test="pipeline-run-status">Build completed: {pipelineRun.metadata.name}</span>
  );
});

const useLatestBuildMock = useLatestPushBuildPipelineRunForComponentV2 as jest.Mock;
const getCommitsFromPLRsMock = getCommitsFromPLRs as jest.Mock;

const mockPipelineRun = {
  metadata: {
    name: 'my-component-on-push-abc123',
    namespace: 'test-ns',
    uid: 'plr-uid',
    labels: {
      [PipelineRunLabel.COMPONENT_VERSION]: 'nice',
    },
  },
  status: {
    conditions: [{ type: 'Succeeded', status: 'True' }],
    completionTime: '2026-03-03T21:37:00Z',
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

describe('LatestPushBuildSection', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render a skeleton while loading', () => {
    useLatestBuildMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<LatestPushBuildSection componentName={'my-component'} />);
    expect(screen.getByTestId('latest-build-loading')).toBeInTheDocument();
  });

  it('should render an error state when pipeline run fetch fails', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, { code: 500 }]);
    renderWithQueryClientAndRouter(<LatestPushBuildSection componentName={'my-component'} />);
    expect(screen.getByText('Unable to load pipeline run')).toBeInTheDocument();
  });

  it('should render an info alert when no build pipeline exists', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, undefined]);
    renderWithQueryClientAndRouter(<LatestPushBuildSection componentName={'my-component'} />);
    expect(screen.getByText('No build pipeline available')).toBeInTheDocument();
  });

  it('should render commit info and pipeline run on success', () => {
    useLatestBuildMock.mockReturnValue([mockPipelineRun, true, undefined]);
    getCommitsFromPLRsMock.mockReturnValue([mockCommit]);

    renderWithQueryClientAndRouter(<LatestPushBuildSection componentName={'my-component'} />);

    // commit section
    expect(screen.getByText(/Red Hat Konflux update/)).toBeInTheDocument();
    expect(screen.getByText(/#40/)).toBeInTheDocument();
    expect(screen.getByTestId('commit-label-mock')).toBeInTheDocument();

    // build status and component version
    expect(screen.getByTestId('pipeline-run-status')).toHaveTextContent('Build completed');
    expect(screen.getByTestId('latest-build-version')).toHaveTextContent('nice');
  });

  it('should omit the commit details when no commit is returned', () => {
    useLatestBuildMock.mockReturnValue([mockPipelineRun, true, undefined]);
    getCommitsFromPLRsMock.mockReturnValue([]);

    renderWithQueryClientAndRouter(<LatestPushBuildSection componentName={'my-component'} />);

    expect(screen.queryByText(/Red Hat Konflux update/)).not.toBeInTheDocument();
    expect(screen.getByTestId('pipeline-run-status')).toHaveTextContent(
      'Build completed: my-component-on-push-abc123',
    );
  });

  it('should not render PR number for non-PR commits', () => {
    const pushCommit = { ...mockCommit, isPullRequest: false, pullRequestNumber: '' };
    useLatestBuildMock.mockReturnValue([mockPipelineRun, true, undefined]);
    getCommitsFromPLRsMock.mockReturnValue([pushCommit]);

    renderWithQueryClientAndRouter(<LatestPushBuildSection componentName={'my-component'} />);

    expect(screen.queryByText(/#40/)).not.toBeInTheDocument();
    expect(screen.getByText(/Red Hat Konflux update/)).toBeInTheDocument();
  });

  it('should not render CommitLabel when shaURL is missing', () => {
    const commitWithoutURL = { ...mockCommit, shaURL: '' };
    useLatestBuildMock.mockReturnValue([mockPipelineRun, true, undefined]);
    getCommitsFromPLRsMock.mockReturnValue([commitWithoutURL]);

    renderWithQueryClientAndRouter(<LatestPushBuildSection componentName={'my-component'} />);

    expect(screen.queryByTestId('commit-label-mock')).not.toBeInTheDocument();
    expect(screen.getByText(/Red Hat Konflux update/)).toBeInTheDocument();
  });

  it('should pass component name to the hook', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, undefined]);
    renderWithQueryClientAndRouter(<LatestPushBuildSection componentName={'my-component'} />);
    expect(useLatestBuildMock).toHaveBeenCalledWith('test-ns', 'my-component', undefined);
  });

  it('should pass version to the hook when provided', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, undefined]);
    renderWithQueryClientAndRouter(
      <LatestPushBuildSection componentName={'my-component'} version="ver-1.0" />,
    );
    expect(useLatestBuildMock).toHaveBeenCalledWith('test-ns', 'my-component', 'ver-1.0');
  });
});
