import { MemoryRouter, useNavigate } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useIssueCountsBySeverity, useIssueCountsByType } from '~/kite/kite-hooks';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { IssueDistributionCard } from '../IssueDistributionCard';

jest.mock('~/kite/kite-hooks');
jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: () => 'test-namespace',
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const mockUseIssueCountsBySeverity = useIssueCountsBySeverity as jest.Mock;
const mockUseIssueCountsByType = useIssueCountsByType as jest.Mock;
const mockNavigate = jest.fn();
const mockUseNavigate = useNavigate as jest.Mock;

describe('IssueDistributionCard', () => {
  const renderComponent = () => {
    return renderWithQueryClient(
      <MemoryRouter>
        <IssueDistributionCard />
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  describe('Loading states', () => {
    it('should render loading skeletons while severity data is loading', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: undefined,
        isLoaded: false,
        error: undefined,
      });
      mockUseIssueCountsByType.mockReturnValue({
        counts: { build: 4, test: 3 },
        isLoaded: true,
        error: undefined,
      });

      renderComponent();

      // Check for skeleton loaders - they have implicit role img
      const skeletons = screen.getAllByRole('img', { hidden: true });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render loading skeletons while type data is loading', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 5, major: 3, minor: 2, info: 1 },
        isLoaded: true,
        error: undefined,
      });
      mockUseIssueCountsByType.mockReturnValue({
        counts: undefined,
        isLoaded: false,
        error: undefined,
      });

      const { container } = renderComponent();

      // Check for chart loading skeleton by className
      const chartSkeleton = container.querySelector(
        '.issue-distribution-card__chart-loading-state',
      );
      expect(chartSkeleton).toBeInTheDocument();
    });
  });

  describe('Severity section', () => {
    beforeEach(() => {
      mockUseIssueCountsByType.mockReturnValue({
        counts: { build: 1 },
        isLoaded: true,
        error: undefined,
      });
    });

    it('should render severity counts when loaded', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 5, major: 3, minor: 2, info: 1 },
        isLoaded: true,
        error: undefined,
      });

      renderComponent();

      expect(screen.getByText('Issues by severity')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Major')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Minor')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('should render zero counts correctly', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: 0, minor: 0, info: 0 },
        isLoaded: true,
        error: undefined,
      });

      renderComponent();

      const zeroCounts = screen.getAllByText('0');
      expect(zeroCounts.length).toBe(4); // 4 severity levels with 0
    });

    it('should display error state when severity data fails to load', () => {
      const mockError = new Error('Failed to fetch severity data');
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: undefined,
        isLoaded: true,
        error: mockError,
      });

      renderComponent();

      expect(screen.getByText(/issue severity data/i)).toBeInTheDocument();
    });
  });

  describe('Type section with pie chart', () => {
    beforeEach(() => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 5, major: 3, minor: 2, info: 1 },
        isLoaded: true,
        error: undefined,
      });
    });

    it('should render pie chart and legend when type counts are loaded', () => {
      mockUseIssueCountsByType.mockReturnValue({
        counts: { build: 4, test: 3, release: 2 },
        isLoaded: true,
        error: undefined,
      });

      renderComponent();

      expect(screen.getByRole('heading', { name: 'Issues by type' })).toBeInTheDocument();
      expect(screen.getByText(/Build: 4/)).toBeInTheDocument();
      expect(screen.getByText(/Test: 3/)).toBeInTheDocument();
      expect(screen.getByText(/Release: 2/)).toBeInTheDocument();
    });

    it('should show empty state when all type counts are zero', () => {
      mockUseIssueCountsByType.mockReturnValue({
        counts: { build: 0, test: 0, release: 0, dependency: 0, pipeline: 0 },
        isLoaded: true,
        error: undefined,
      });

      renderComponent();

      expect(screen.getByText('No issues found')).toBeInTheDocument();
    });

    it('should show empty state when counts object is empty', () => {
      mockUseIssueCountsByType.mockReturnValue({
        counts: {},
        isLoaded: true,
        error: undefined,
      });

      renderComponent();

      expect(screen.getByText('No issues found')).toBeInTheDocument();
    });

    it('should display error state when type data fails to load', () => {
      const mockError = new Error('Failed to fetch type data');
      mockUseIssueCountsByType.mockReturnValue({
        counts: undefined,
        isLoaded: true,
        error: mockError,
      });

      renderComponent();

      expect(screen.getByText(/issue type data/i)).toBeInTheDocument();
    });

    it('should render legend colors for each type', () => {
      mockUseIssueCountsByType.mockReturnValue({
        counts: { build: 4, test: 3 },
        isLoaded: true,
        error: undefined,
      });

      const { container } = renderComponent();

      // Check for legend color boxes
      const legendColors = container.querySelectorAll('.issue-distribution-card__legend-color');
      expect(legendColors.length).toBe(2);
    });
  });

  describe('View more button', () => {
    beforeEach(() => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 5, major: 3, minor: 2, info: 1 },
        isLoaded: true,
        error: undefined,
      });
      mockUseIssueCountsByType.mockReturnValue({
        counts: { build: 4, test: 3 },
        isLoaded: true,
        error: undefined,
      });
    });

    it('should render view more button', () => {
      renderComponent();

      const viewMoreButton = screen.getByRole('button', { name: /view more/i });
      expect(viewMoreButton).toBeInTheDocument();
    });

    it('should navigate when view more button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const viewMoreButton = screen.getByRole('button', { name: /view more/i });
      await user.click(viewMoreButton);

      expect(mockNavigate).toHaveBeenCalledWith('list');
    });
  });

  describe('Integration', () => {
    it('should render both sections when all data is loaded', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 5, major: 3, minor: 2, info: 1 },
        isLoaded: true,
        error: undefined,
      });
      mockUseIssueCountsByType.mockReturnValue({
        counts: { build: 4, test: 3, release: 2, dependency: 1, pipeline: 1 },
        isLoaded: true,
        error: undefined,
      });

      renderComponent();

      // Verify both sections are present
      expect(screen.getByRole('heading', { name: 'Issues by severity' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Issues by type' })).toBeInTheDocument();

      // Verify severity data
      expect(screen.getByText('5')).toBeInTheDocument(); // critical
      expect(screen.getByText('Critical')).toBeInTheDocument();

      // Verify type data
      expect(screen.getByText(/Build: 4/)).toBeInTheDocument();
      expect(screen.getByText(/Pipeline: 1/)).toBeInTheDocument();
    });

    it('should handle partial errors gracefully', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 5, major: 3, minor: 2, info: 1 },
        isLoaded: true,
        error: undefined,
      });
      mockUseIssueCountsByType.mockReturnValue({
        counts: undefined,
        isLoaded: true,
        error: new Error('Type data error'),
      });

      renderComponent();

      // Severity section should still work
      expect(screen.getByText('Issues by severity')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();

      // Type section should show error
      expect(screen.getByText(/issue type data/i)).toBeInTheDocument();
    });
  });
});
