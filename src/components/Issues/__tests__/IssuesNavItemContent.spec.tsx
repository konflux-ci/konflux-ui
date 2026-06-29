import { screen } from '@testing-library/react';
import { useIssueCountsBySeverity } from '~/kite/kite-hooks';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { IssueNavItemContent } from '../IssuesNavItemContent';

jest.mock('~/kite/kite-hooks', () => ({
  useIssueCountsBySeverity: jest.fn(),
}));

jest.mock('~/feature-flags/FeatureFlagIndicator', () => ({
  FeatureFlagIndicator: () => null,
}));

const mockUseIssueCountsBySeverity = useIssueCountsBySeverity as jest.Mock;

describe('IssueNavItemContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should render only text without icon when loading', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: undefined,
        isLoaded: false,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should render only text without icon when there is an error', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: undefined,
        isLoaded: true,
        error: { code: 500, message: 'Server error' },
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render only text without icon when no issues exist', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: 0, minor: 0, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should render only text without icon when counts is null', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: null,
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should render only text without icon when counts is undefined', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: undefined,
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });

  describe('Critical issues', () => {
    it('should render danger icon when unresolved critical issues exist', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 1, major: 0, minor: 0, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.getByTestId('critical-issues-icon')).toBeInTheDocument();
    });

    it('should not render icon when critical issue is resolved', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: 0, minor: 0, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should prioritize critical over major issues', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 1, major: 1, minor: 0, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByTestId('critical-issues-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });

  describe('Major issues', () => {
    it('should render warning icon when unresolved major issues exist', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: 1, minor: 0, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.getByTestId('major-issues-icon')).toBeInTheDocument();
    });

    it('should not render icon when major issue is resolved', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: 0, minor: 0, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });

  describe('Minor and Info issues', () => {
    it('should not render icon for unresolved minor issues', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: 0, minor: 1, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should not render icon for unresolved info issues', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: 0, minor: 0, info: 1 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });

  describe('Multiple issues', () => {
    it('should handle multiple issues with different states correctly', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: 0, minor: 1, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should handle zero counts explicitly', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: 0, minor: 0, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should not render critical icon when count is null', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: null, major: 0, minor: 0, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });

    it('should not render major icon when count is undefined', () => {
      mockUseIssueCountsBySeverity.mockReturnValue({
        counts: { critical: 0, major: undefined, minor: 0, info: 0 },
        isLoaded: true,
        error: null,
      });

      renderWithQueryClientAndRouter(<IssueNavItemContent namespace="test-namespace" />);

      expect(screen.getByText(/Issues/)).toBeInTheDocument();
      expect(screen.queryByTestId('critical-issues-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('major-issues-icon')).not.toBeInTheDocument();
    });
  });
});
