import { screen } from '@testing-library/react';
import { Issue, IssueSeverity, IssueState, IssueType } from '~/kite/issue-type';
import { useCriticalAndMajorIssues } from '~/kite/kite-hooks';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import IssuesNavItemContent from '../IssuesNavItemContent';

jest.mock('~/kite/kite-hooks', () => ({
  useCriticalAndMajorIssues: jest.fn(),
}));

jest.mock('~/feature-flags/FeatureFlagIndicator', () => ({
  FeatureFlagIndicator: () => null,
}));

const mockUseCriticalAndMajorIssues = useCriticalAndMajorIssues as jest.Mock;

const createMockIssue = (severity: IssueSeverity, state: IssueState, id: string): Issue => ({
  id,
  title: `Test Issue ${id}`,
  description: 'Test description',
  severity,
  issueType: IssueType.BUILD,
  state,
  detectedAt: '2023-10-01T12:00:00Z',
  namespace: 'test-namespace',
  scope: {
    resourceType: 'test-resource',
    resourceName: 'test-name',
    resourceNamespace: 'test-namespace',
  },
  links: [],
  relatedFrom: [],
  relatedTo: [],
  createdAt: '2023-10-01T12:00:00Z',
  updatedAt: '2023-10-01T12:00:00Z',
});

describe('IssueNavItemContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should render no icon when loading', () => {
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [],
        isLoaded: false,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should render no icon when there is an error', () => {
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [],
        isLoaded: true,
        hasError: true,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render no icon when no issues exist', () => {
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should render no icon when data is empty array', () => {
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should render no icon when API returns no active issues', () => {
      // API filters by ACTIVE state, so resolved issues won't be returned
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });

  describe('Critical issues', () => {
    it('should render danger icon when active critical issues exist', () => {
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [createMockIssue(IssueSeverity.CRITICAL, IssueState.ACTIVE, 'crit-1')],
            total: 1,
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.getByTestId('critical-issues-icon')).toBeInTheDocument();
    });

    it('should not render icon when no active critical issues', () => {
      // API filters by ACTIVE state, so this returns empty
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should prioritize critical over major issues', () => {
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [createMockIssue(IssueSeverity.CRITICAL, IssueState.ACTIVE, 'crit-1')],
            total: 1,
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [createMockIssue(IssueSeverity.MAJOR, IssueState.ACTIVE, 'major-1')],
            total: 1,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.getByTestId('critical-issues-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });

  describe('Major issues', () => {
    it('should render warning icon when active major issues exist', () => {
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [createMockIssue(IssueSeverity.MAJOR, IssueState.ACTIVE, 'major-1')],
            total: 1,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.getByTestId('major-issues-icon')).toBeInTheDocument();
    });

    it('should not render icon when no active major issues', () => {
      // API filters by ACTIVE state, so this returns empty
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });

  describe('Minor and Info issues', () => {
    it('should not render icon when only minor issues exist (not fetched)', () => {
      // Minor severity is not in the fetched severities array
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });

  describe('Multiple issues', () => {
    it('should handle multiple active critical issues correctly', () => {
      // API only returns ACTIVE issues
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [createMockIssue(IssueSeverity.CRITICAL, IssueState.ACTIVE, 'crit-2')],
            total: 2, // total count from API
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      // Should show critical icon because total > 0
      expect(screen.getByTestId('critical-issues-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should handle when only major issues are active', () => {
      // API only returns ACTIVE issues
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
          {
            severity: IssueSeverity.MAJOR,
            issues: [createMockIssue(IssueSeverity.MAJOR, IssueState.ACTIVE, 'major-2')],
            total: 2, // total count from API
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      // Should show major icon because critical has no active issues but major has some
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('major-issues-icon')).toBeInTheDocument();
    });

    it('should handle when severity group is not found', () => {
      mockUseCriticalAndMajorIssues.mockReturnValue({
        data: [
          {
            severity: IssueSeverity.CRITICAL,
            issues: [],
            total: 0,
            isLoading: false,
            error: null,
          },
        ],
        isLoaded: true,
        hasError: false,
      });

      renderWithQueryClientAndRouter(<IssuesNavItemContent namespace="test-namespace" />);

      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });
});
