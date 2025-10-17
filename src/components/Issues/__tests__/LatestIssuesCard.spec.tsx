import * as React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { useLatestIssues } from '~/hooks/useIssues';
import { useNamespace } from '../../../shared/providers/Namespace';
import { mockTestNamespaceIssues, mockAllSeverityIssues } from '../__data__/mock-issues-data';
import { LatestIssuesCard } from '../LatestIssuesCard';

jest.mock('~/hooks/useIssues');
jest.mock('../../../shared/providers/Namespace');

const mockUseLatestIssues = useLatestIssues as jest.MockedFunction<typeof useLatestIssues>;
const mockUseNamespace = useNamespace as jest.MockedFunction<typeof useNamespace>;

// Use pre-filtered mock data for test-ns namespace

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LatestIssuesCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespace.mockReturnValue('test-ns');
  });

  it('renders loading state correctly', () => {
    mockUseLatestIssues.mockReturnValue([undefined, false, undefined]);

    renderWithRouter(<LatestIssuesCard />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const mockError = new Error('Failed to fetch issues');
    mockUseLatestIssues.mockReturnValue([undefined, true, mockError]);

    renderWithRouter(<LatestIssuesCard />);

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it('renders empty state when no issues found', () => {
    mockUseLatestIssues.mockReturnValue([
      { data: [], total: 0, limit: 10, offset: 0 },
      true,
      undefined,
    ]);

    renderWithRouter(<LatestIssuesCard />);

    expect(screen.getByText('Latest issues')).toBeInTheDocument();
    expect(screen.getByText('No issues found.')).toBeInTheDocument();
    expect(screen.queryByText('View all issues')).not.toBeInTheDocument();
  });

  it('renders issues list correctly with all severity types', () => {
    mockUseLatestIssues.mockReturnValue([
      {
        data: mockTestNamespaceIssues,
        total: mockTestNamespaceIssues.length,
        limit: 10,
        offset: 0,
      },
      true,
      undefined,
    ]);

    renderWithRouter(<LatestIssuesCard />);

    // Check header
    expect(screen.getByText('Latest issues')).toBeInTheDocument();

    // Check all issues are rendered (only those in test-ns namespace)
    expect(screen.getByText('Release failed')).toBeInTheDocument();
    expect(screen.getByText('Pipeline run failed')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
    expect(screen.getByText('Dependency issue')).toBeInTheDocument();
    expect(screen.getByText('Build timeout')).toBeInTheDocument();

    // Check issue descriptions
    expect(screen.getByText(/Readiness probe failed/)).toBeInTheDocument();
    expect(screen.getByText(/Successfully assigned default/)).toBeInTheDocument();

    // Check "View all issues" link is present
    const viewAllLink = screen.getByText('View all issues');
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink.closest('a')).toHaveAttribute('href', '/issues?state=ACTIVE');
  });

  it('renders severity icons correctly', () => {
    mockUseLatestIssues.mockReturnValue([
      {
        data: mockTestNamespaceIssues,
        total: mockTestNamespaceIssues.length,
        limit: 10,
        offset: 0,
      },
      true,
      undefined,
    ]);

    const { container } = renderWithRouter(<LatestIssuesCard />);

    // Check critical severity icon
    expect(container.querySelector('.latest-issues-card__icon--critical')).toBeInTheDocument();

    // Check major severity icon
    expect(container.querySelector('.latest-issues-card__icon--major')).toBeInTheDocument();

    // Check minor severity icon
    expect(container.querySelector('.latest-issues-card__icon--minor')).toBeInTheDocument();

    // Check info severity icon
    expect(container.querySelector('.latest-issues-card__icon--info')).toBeInTheDocument();
  });

  it('handles all severity types correctly', () => {
    mockUseLatestIssues.mockReturnValue([
      { data: mockAllSeverityIssues, total: mockAllSeverityIssues.length, limit: 10, offset: 0 },
      true,
      undefined,
    ]);

    const { container } = renderWithRouter(<LatestIssuesCard />);

    // Should display all severity icons
    expect(container.querySelector('.latest-issues-card__icon--critical')).toBeInTheDocument();
    expect(container.querySelector('.latest-issues-card__icon--major')).toBeInTheDocument();
    expect(container.querySelector('.latest-issues-card__icon--minor')).toBeInTheDocument();
    expect(container.querySelector('.latest-issues-card__icon--info')).toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    mockUseLatestIssues.mockReturnValue([
      { data: [], total: 0, limit: 10, offset: 0 },
      true,
      undefined,
    ]);

    const { container } = renderWithRouter(<LatestIssuesCard className="custom-class" />);

    expect(container.querySelector('.latest-issues-card.custom-class')).toBeInTheDocument();
  });

  it('calls useNamespace hook correctly', () => {
    mockUseLatestIssues.mockReturnValue([
      { data: [], total: 0, limit: 10, offset: 0 },
      true,
      undefined,
    ]);

    renderWithRouter(<LatestIssuesCard />);

    expect(mockUseNamespace).toHaveBeenCalledTimes(1);
  });

  it('calls useLatestIssues hook with correct parameters', () => {
    mockUseLatestIssues.mockReturnValue([
      { data: [], total: 0, limit: 10, offset: 0 },
      true,
      undefined,
    ]);

    renderWithRouter(<LatestIssuesCard />);

    expect(mockUseLatestIssues).toHaveBeenCalledWith('test-ns', 10);
  });

  it('renders timestamps correctly', () => {
    mockUseLatestIssues.mockReturnValue([
      { data: [mockTestNamespaceIssues[0]], total: 1, limit: 10, offset: 0 },
      true,
      undefined,
    ]);

    const { container } = renderWithRouter(<LatestIssuesCard />);

    expect(container.querySelector('.latest-issues-card__timestamp')).toBeInTheDocument();
  });

  it('handles undefined data gracefully', () => {
    mockUseLatestIssues.mockReturnValue([undefined, true, undefined]);

    renderWithRouter(<LatestIssuesCard />);

    expect(screen.getByText('Latest issues')).toBeInTheDocument();
    expect(screen.getByText('No issues found.')).toBeInTheDocument();
  });

  it('renders correct number of issues based on data', () => {
    const singleIssue = [mockTestNamespaceIssues[0]];
    mockUseLatestIssues.mockReturnValue([
      { data: singleIssue, total: 1, limit: 10, offset: 0 },
      true,
      undefined,
    ]);

    const { container } = renderWithRouter(<LatestIssuesCard />);

    const issueItems = container.querySelectorAll('.latest-issues-card__item');
    expect(issueItems).toHaveLength(1);
    expect(screen.getByText('Release failed')).toBeInTheDocument();
  });
});
