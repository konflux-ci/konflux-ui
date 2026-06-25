import { screen } from '@testing-library/react';
import { Issue, IssueState, IssueSeverity, IssueType } from '~/kite/issue-type';
import { useIssues } from '~/kite/kite-hooks';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { IssueNavItemContent } from '../IssuesNavItemContent';

jest.mock('~/kite/kite-hooks', () => ({
  useIssues: jest.fn(),
}));

jest.mock('~/feature-flags/FeatureFlagIndicator', () => ({
  FeatureFlagIndicator: () => null,
}));

const mockUseIssues = useIssues as jest.Mock;

const createMockIssue = (overrides: Partial<Issue> = {}): Issue => ({
  id: 'issue-1',
  title: 'Test Issue',
  description: 'This is a test issue description',
  severity: IssueSeverity.CRITICAL,
  issueType: IssueType.BUILD,
  state: IssueState.ACTIVE,
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
  ...overrides,
});

describe('IssueNavItemContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should render only text without icon when loading', () => {
      mockUseIssues.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should render only text without icon when there is an error', () => {
      mockUseIssues.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { code: 500, message: 'Server error' },
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render only text without icon when no issues exist', () => {
      mockUseIssues.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Critical issues', () => {
    it('should render danger icon when unresolved critical issues exist', () => {
      const mockIssues = [
        createMockIssue({
          severity: IssueSeverity.CRITICAL,
          state: IssueState.ACTIVE,
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
      expect(icon.parentElement).toHaveClass('pf-m-danger');
    });

    it('should not render icon when critical issue is resolved', () => {
      const mockIssues = [
        createMockIssue({
          severity: IssueSeverity.CRITICAL,
          state: IssueState.RESOLVED,
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should prioritize critical over major issues', () => {
      const mockIssues = [
        createMockIssue({
          id: 'major-issue',
          severity: IssueSeverity.MAJOR,
          state: IssueState.ACTIVE,
        }),
        createMockIssue({
          id: 'critical-issue',
          severity: IssueSeverity.CRITICAL,
          state: IssueState.ACTIVE,
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      const icon = screen.getByRole('img', { hidden: true });
      expect(icon.parentElement).toHaveClass('pf-m-danger');
    });
  });

  describe('Major issues', () => {
    it('should render warning icon when unresolved major issues exist', () => {
      const mockIssues = [
        createMockIssue({
          severity: IssueSeverity.MAJOR,
          state: IssueState.ACTIVE,
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
      expect(icon.parentElement).toHaveClass('pf-m-warning');
    });

    it('should not render icon when major issue is resolved', () => {
      const mockIssues = [
        createMockIssue({
          severity: IssueSeverity.MAJOR,
          state: IssueState.RESOLVED,
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Minor and Info issues', () => {
    it('should not render icon for unresolved minor issues', () => {
      const mockIssues = [
        createMockIssue({
          severity: IssueSeverity.MINOR,
          state: IssueState.ACTIVE,
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should not render icon for unresolved info issues', () => {
      const mockIssues = [
        createMockIssue({
          severity: IssueSeverity.INFO,
          state: IssueState.ACTIVE,
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Multiple issues', () => {
    it('should handle multiple issues with different states correctly', () => {
      const mockIssues = [
        createMockIssue({
          id: 'resolved-critical',
          severity: IssueSeverity.CRITICAL,
          state: IssueState.RESOLVED,
        }),
        createMockIssue({
          id: 'active-minor',
          severity: IssueSeverity.MINOR,
          state: IssueState.ACTIVE,
        }),
        createMockIssue({
          id: 'resolved-major',
          severity: IssueSeverity.MAJOR,
          state: IssueState.RESOLVED,
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });
});
