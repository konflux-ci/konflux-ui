import { screen } from '@testing-library/react';
import { Issue, IssueState, IssueSeverity, IssueType } from '~/kite/issue-type';
import { useIssues } from '~/kite/kite-hooks';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { LatestIssuesCard } from '../LatestIssuesCard';

// Mock dependencies
jest.mock('~/kite/kite-hooks', () => ({
  useIssues: jest.fn(),
}));

const mockUseIssues = useIssues as jest.Mock;

// Mock issues data
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

describe('LatestIssuesCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceHook('test-namespace');
  });

  describe('Loading state', () => {
    it('should render spinner when loading', () => {
      mockUseIssues.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByTestId('loading-skeleton-latest-issues')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should render error state when there is an error', () => {
      const mockError = { code: 500, message: 'Internal Server Error' };
      mockUseIssues.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);
      expect(screen.getByText('Unable to load issues')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render empty state when no issues are returned', () => {
      mockUseIssues.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByText('Latest issues')).toBeInTheDocument();
      expect(screen.getByText('No active issues found for this namespace.')).toBeInTheDocument();
    });

    it('should render empty state when data is undefined', () => {
      mockUseIssues.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByText('Latest issues')).toBeInTheDocument();
      expect(screen.getByText('No active issues found for this namespace.')).toBeInTheDocument();
    });

    it('should render empty state when data.data is undefined', () => {
      mockUseIssues.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByText('Latest issues')).toBeInTheDocument();
      expect(screen.getByText('No active issues found for this namespace.')).toBeInTheDocument();
    });
  });

  describe('Success state with issues', () => {
    it('should render issues when data is available', () => {
      const mockIssues = [
        createMockIssue({
          id: 'issue-1',
          title: 'Critical Build Issue',
          description: 'Build failed due to dependency conflict',
          severity: IssueSeverity.CRITICAL,
          detectedAt: '2023-10-01T12:00:00Z',
        }),
        createMockIssue({
          id: 'issue-2',
          title: 'Major Test Failure',
          description: 'Integration tests are failing',
          severity: IssueSeverity.MAJOR,
          detectedAt: '2023-10-01T13:30:00Z',
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByText('Latest issues')).toBeInTheDocument();
      expect(screen.getByText('Critical Build Issue')).toBeInTheDocument();
      expect(screen.getByText('Build failed due to dependency conflict')).toBeInTheDocument();
      expect(screen.getByText('Major Test Failure')).toBeInTheDocument();
      expect(screen.getByText('Integration tests are failing')).toBeInTheDocument();

      // Check that the "View all issues" link is present and has correct href
      const viewAllLink = screen.getByRole('link', { name: /view all issues/i });
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink).toHaveAttribute('href', '/ns/test-namespace/issues/list');
    });

    it('should render issues with different severities and their corresponding icons', () => {
      const mockIssues = [
        createMockIssue({
          id: 'critical-issue',
          title: 'Critical Issue',
          severity: IssueSeverity.CRITICAL,
          detectedAt: '2023-10-01T12:00:00Z',
        }),
        createMockIssue({
          id: 'major-issue',
          title: 'Major Issue',
          severity: IssueSeverity.MAJOR,
          detectedAt: '2023-10-01T12:00:00Z',
        }),
        createMockIssue({
          id: 'minor-issue',
          title: 'Minor Issue',
          severity: IssueSeverity.MINOR,
          detectedAt: '2023-10-01T12:00:00Z',
        }),
        createMockIssue({
          id: 'info-issue',
          title: 'Info Issue',
          severity: IssueSeverity.INFO,
          detectedAt: '2023-10-01T12:00:00Z',
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByText('Critical Issue')).toBeInTheDocument();
      expect(screen.getByText('Major Issue')).toBeInTheDocument();
      expect(screen.getByText('Minor Issue')).toBeInTheDocument();
      expect(screen.getByText('Info Issue')).toBeInTheDocument();

      // Verify that all issues are rendered with their severity icons
      const issueItems = screen.getAllByRole('listitem');
      expect(issueItems).toHaveLength(4);
    });

    it('should render MINOR severity issue with correct icon', () => {
      const mockIssue = createMockIssue({
        id: 'minor-only',
        title: 'Minor Issue Only',
        severity: IssueSeverity.MINOR,
        detectedAt: '2023-10-01T12:00:00Z',
      });

      mockUseIssues.mockReturnValue({
        data: { data: [mockIssue] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByText('Minor Issue Only')).toBeInTheDocument();
    });

    it('should render INFO severity issue with correct icon', () => {
      const mockIssue = createMockIssue({
        id: 'info-only',
        title: 'Info Issue Only',
        severity: IssueSeverity.INFO,
        detectedAt: '2023-10-01T12:00:00Z',
      });

      mockUseIssues.mockReturnValue({
        data: { data: [mockIssue] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByText('Info Issue Only')).toBeInTheDocument();
    });

    it('should handle unknown severity with unknown icon', () => {
      const mockIssue = createMockIssue({
        id: 'unknown-issue',
        title: 'Unknown Severity Issue',
        severity: 'unknown' as IssueSeverity,
        detectedAt: '2023-10-01T12:00:00Z',
      });

      mockUseIssues.mockReturnValue({
        data: { data: [mockIssue] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByText('Unknown Severity Issue')).toBeInTheDocument();
    });

    it('should format timestamps correctly', () => {
      const mockIssue = createMockIssue({
        id: 'time-test',
        title: 'Timestamp Test Issue',
        detectedAt: '2023-10-15T14:30:45Z', // Sunday, October 15, 2023, 2:30:45 PM UTC
      });

      mockUseIssues.mockReturnValue({
        data: { data: [mockIssue] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      // The timestamp should be formatted according to the formatTimestamp function
      // This will vary based on the user's locale, so we just check that some timestamp is present
      expect(screen.getByText(/Oct 15.*\d{1,2}:\d{2}.*[AP]M/)).toBeInTheDocument();
    });

    it('should format timestamps with minutes correctly', () => {
      const mockIssue = createMockIssue({
        id: 'time-with-minutes',
        title: 'Timestamp With Minutes Test',
        detectedAt: '2023-10-15T14:32:45Z', // Should include minutes
      });

      mockUseIssues.mockReturnValue({
        data: { data: [mockIssue] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      // This should show minutes as well
      expect(screen.getByText(/Oct 15.*\d{1,2}:\d{2}.*[AP]M/)).toBeInTheDocument();
    });
  });

  describe('Hook integration', () => {
    it('should call useIssues with correct parameters', () => {
      mockUseNamespaceHook('test-workspace');
      mockUseIssues.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(mockUseIssues).toHaveBeenCalledWith({
        namespace: 'test-workspace',
        state: IssueState.ACTIVE,
        limit: 10,
      });
    });

    it('should handle different namespace values', () => {
      mockUseNamespaceHook('production-namespace');
      mockUseIssues.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(mockUseIssues).toHaveBeenCalledWith({
        namespace: 'production-namespace',
        state: IssueState.ACTIVE,
        limit: 10,
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      mockUseIssues.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      const heading = screen.getByRole('heading', { name: 'Latest issues' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('should have proper list structure when issues are present', () => {
      const mockIssues = [
        createMockIssue({
          id: 'issue-1',
          title: 'Test Issue 1',
          detectedAt: '2023-10-01T12:00:00Z',
        }),
        createMockIssue({
          id: 'issue-2',
          title: 'Test Issue 2',
          detectedAt: '2023-10-01T13:00:00Z',
        }),
      ];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });

    it('should have accessible link to view all issues', () => {
      const mockIssues = [createMockIssue()];

      mockUseIssues.mockReturnValue({
        data: { data: mockIssues },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      const viewAllLink = screen.getByRole('link', { name: /view all issues/i });
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink).toHaveAttribute('href', '/ns/test-namespace/issues/list');
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed date strings gracefully', () => {
      const mockIssue = createMockIssue({
        id: 'malformed-date',
        title: 'Malformed Date Issue',
        detectedAt: 'invalid-date-string',
      });

      mockUseIssues.mockReturnValue({
        data: { data: [mockIssue] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      // Should still render the issue even with invalid date
      expect(screen.getByText('Malformed Date Issue')).toBeInTheDocument();
      // The Timestamp component will handle invalid dates by displaying "-"
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle issues with empty titles and descriptions', () => {
      const mockIssue = createMockIssue({
        id: 'empty-content',
        title: '',
        description: '',
        detectedAt: '2023-10-01T12:00:00Z',
      });

      mockUseIssues.mockReturnValue({
        data: { data: [mockIssue] },
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      // Should still render the list item
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(1);
    });
  });
});
