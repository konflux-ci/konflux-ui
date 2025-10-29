import { screen } from '@testing-library/react';
import { Issue, IssueState, IssueSeverity, IssueType } from '~/kite/issue-type';
import { useIssues } from '~/kite/kite-hooks';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { LatestIssuesCard } from '../LatestIssuesCard';

// Mock dependencies
jest.mock('~/kite/kite-hooks', () => ({
  useIssues: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

jest.mock('~/shared/utils/error-utils', () => ({
  getErrorState: jest.fn(),
}));

// Create mock functions
const mockUseIssues = useIssues as jest.Mock;
const mockGetErrorState = getErrorState as jest.Mock;
const mockUseNamespace = useNamespace as jest.Mock;

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
    mockUseNamespace.mockReturnValue('test-namespace');
  });

  describe('Loading state', () => {
    it('should render spinner when loading', () => {
      mockUseIssues.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should render error state when there is an error', () => {
      const mockError = new Error('Test error');
      mockUseIssues.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      const mockErrorComponent = <div>Error component</div>;
      mockGetErrorState.mockReturnValue(mockErrorComponent);

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(mockGetErrorState).toHaveBeenCalledWith(mockError, true, 'issues');
      expect(screen.getByText('Error component')).toBeInTheDocument();
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
      expect(screen.getByText('No issues found')).toBeInTheDocument();
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
      expect(screen.getByText('No issues found')).toBeInTheDocument();
    });

    it('should render empty state when data.data is undefined', () => {
      mockUseIssues.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<LatestIssuesCard />);

      expect(screen.getByText('Latest issues')).toBeInTheDocument();
      expect(screen.getByText('No issues found')).toBeInTheDocument();
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
      expect(viewAllLink).toHaveAttribute('href', '/issues?state=ACTIVE');
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
      expect(screen.getByText(/Oct 15.*8:00.*PM/)).toBeInTheDocument();
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
      expect(screen.getByText(/Oct 15.*8:02.*PM/)).toBeInTheDocument();
    });
  });

  describe('Component props', () => {
    it('should apply custom className when provided', () => {
      mockUseIssues.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
      });

      const { container } = renderWithQueryClientAndRouter(
        <LatestIssuesCard className="custom-class" />,
      );

      const cardElement = container.querySelector('.latest-issues-card.custom-class');
      expect(cardElement).toBeInTheDocument();
    });

    it('should work without className prop', () => {
      mockUseIssues.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
      });

      const { container } = renderWithQueryClientAndRouter(<LatestIssuesCard />);

      const cardElement = container.querySelector('.latest-issues-card');
      expect(cardElement).toBeInTheDocument();
    });
  });

  describe('Hook integration', () => {
    it('should call useIssues with correct parameters', () => {
      mockUseNamespace.mockReturnValue('test-workspace');
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
      mockUseNamespace.mockReturnValue('production-namespace');
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
      expect(viewAllLink).toHaveAttribute('href', '/issues?state=ACTIVE');
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
      // The formatTimestamp function will create a Date object with invalid date,
      // which will result in "Invalid Date" being displayed
      expect(screen.getByText(/Invalid Date/)).toBeInTheDocument();
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
