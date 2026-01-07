import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { usePipelineRunsForCommitV2 } from '../../../../../hooks/usePipelineRunsForCommitV2';
import { renderWithQueryClient } from '../../../../../unit-test-utils/mock-react-query';
import { WithTestNamespaceContext } from '../../../../../unit-test-utils/rendering-utils';
import { createCommitObjectFromPLR } from '../../../../../utils/commits-utils';
import { useCommitStatus } from '../../../commit-status';
import CommitOverviewTab from '../CommitOverviewTab';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../../hooks/usePipelineRunsForCommitV2', () => ({
  usePipelineRunsForCommitV2: jest.fn(),
}));

jest.mock('../../../commit-status', () => ({
  useCommitStatus: jest.fn(),
}));

jest.mock('../../../../../utils/commits-utils', () => ({
  createCommitObjectFromPLR: jest.fn(),
  createRepoBranchURL: jest.fn(),
  createRepoPullRequestURL: jest.fn(),
  getCommitShortName: jest.fn((sha: string) => sha.substring(0, 7)),
}));

const mockUsePipelineRunsForCommitV2 = usePipelineRunsForCommitV2 as jest.Mock;
const mockUseCommitStatus = useCommitStatus as jest.Mock;
const mockCreateCommitObjectFromPLR = createCommitObjectFromPLR as jest.Mock;

// Helper function to render component with route parameters
const renderCommitOverviewTab = () => {
  return renderWithQueryClient(
    WithTestNamespaceContext(
      <MemoryRouter
        initialEntries={['/applications/test-app/commit/abc123456789012345678901234567890abcdefgh']}
      >
        <Routes>
          <Route
            path="/applications/:applicationName/commit/:commitName"
            element={<CommitOverviewTab />}
          />
        </Routes>
      </MemoryRouter>,
      { namespace: 'test-namespace' },
    )(),
  );
};

const mockCommit = {
  sha: 'abc123456789012345678901234567890abcdefgh',
  shaURL: 'https://github.com/org/repo/commit/abc123456789012345678901234567890abcdefgh',
  gitProvider: 'github',
  branch: 'main',
  user: 'test-user',
  creationTime: '2023-01-01T12:00:00Z',
  isPullRequest: false,
  pullRequestNumber: null,
  components: ['component-1', 'component-2'],
};

const mockPipelineRun = {
  metadata: {
    name: 'test-pipeline-run',
    labels: {
      'appstudio.openshift.io/application': 'test-app',
      'appstudio.openshift.io/commit': 'abc123456789012345678901234567890abcdefgh',
    },
  },
  spec: {},
  status: { conditions: [{ type: 'Succeeded', status: 'True' }] },
};

describe('CommitOverviewTab', () => {
  beforeEach(() => {
    mockUseCommitStatus.mockReturnValue(['Succeeded']);
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should display spinner when data is loading', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue([
        [],
        false,
        null,
        () => {},
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
      mockCreateCommitObjectFromPLR.mockReturnValue(null);

      renderCommitOverviewTab();

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error state when there is an error loading data', () => {
      const error = new Error('Failed to load');
      mockUsePipelineRunsForCommitV2.mockReturnValue([
        [],
        true,
        error,
        () => {},
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      renderCommitOverviewTab();

      // Check for real error state content
      expect(screen.getByText('Unable to load commit')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('successful data loading', () => {
    beforeEach(() => {
      mockUsePipelineRunsForCommitV2.mockReturnValue([
        [mockPipelineRun],
        true,
        null,
        () => {},
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
      mockCreateCommitObjectFromPLR.mockReturnValue(mockCommit);
    });

    it('should render commit overview content with basic commit info', () => {
      renderCommitOverviewTab();

      expect(screen.getByText('Events progression triggered by the commit.')).toBeInTheDocument();
      // CommitVisualization component should render - test for its actual content instead of test-id
      expect(screen.getByText('Commit')).toBeInTheDocument();
    });

    it('should display commit details correctly', () => {
      renderCommitOverviewTab();

      // Test for actual commit SHA being displayed (shortened)
      expect(screen.getByText('abc1234')).toBeInTheDocument();

      expect(screen.getByText('main')).toBeInTheDocument();

      expect(screen.getByText('test-user')).toBeInTheDocument();

      // Test for status text being displayed (actual StatusIcon component)
      expect(screen.getByText('Succeeded')).toBeInTheDocument();

      expect(screen.getByText(/component-1/)).toBeInTheDocument();
      expect(screen.getByText(/component-2/)).toBeInTheDocument();
    });

    it('should call hooks with correct parameters', () => {
      renderCommitOverviewTab();

      expect(mockUsePipelineRunsForCommitV2).toHaveBeenCalledWith(
        'test-namespace',
        'test-app',
        'abc123456789012345678901234567890abcdefgh',
        1,
        undefined,
        'build',
      );
      expect(mockUseCommitStatus).toHaveBeenCalledWith(
        'test-app',
        'abc123456789012345678901234567890abcdefgh',
      );
    });
  });
});
