import React from 'react';
import { render, screen } from '@testing-library/react';
import Issues from '../Issues';

// Mock the feature flag hooks
jest.mock('../../../feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
  IfFeature: ({ children, flag }: { children: React.ReactNode; flag: string }) => {
    const { useIsOnFeatureFlag } = jest.requireMock('../../../feature-flags/hooks');
    const isEnabled = useIsOnFeatureFlag(flag);
    return isEnabled ? <>{children}</> : null;
  },
}));

// Get the mocked function
const { useIsOnFeatureFlag } = jest.requireMock('../../../feature-flags/hooks');
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

// Mock DetailsPage component - simplified
jest.mock('../../DetailsPage', () => ({
  DetailsPage: ({ title, description, tabs, headTitle, ...props }) => (
    <div data-testid="details-page" {...props}>
      <div data-testid="title-content">{title}</div>
      <div data-testid="head-title">{headTitle}</div>
      <div data-testid="description">{description}</div>
      <div data-testid="tabs-count">{tabs?.length || 0}</div>
    </div>
  ),
}));

// Mock FeatureFlagIndicator
jest.mock('../../../feature-flags/FeatureFlagIndicator', () => ({
  FeatureFlagIndicator: ({ flags }: { flags: string[] }) => (
    <span data-testid="feature-flag">[{flags.join(',')}]</span>
  ),
}));

// Mock PatternFly Title component
jest.mock('@patternfly/react-core', () => ({
  ...jest.requireActual('@patternfly/react-core'),
  Title: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}));

describe('Issues Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when issues-dashboard feature flag is enabled', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
    });

    it('should render the Issues page', () => {
      const { container } = render(<Issues />);

      // Use querySelector as fallback
      const detailsPage = container.querySelector('[data-testid="details-page"]');
      expect(detailsPage).toBeInTheDocument();
    });

    it('should have correct data-test attribute', () => {
      const { container } = render(<Issues />);

      const detailsPage = container.querySelector('[data-testid="details-page"]');
      expect(detailsPage).toHaveAttribute('data-test', 'issues-data-test');
    });

    it('should display Issues title and feature flag', () => {
      const { container } = render(<Issues />);

      expect(screen.getByRole('heading', { name: /Issues/ })).toBeInTheDocument();

      const featureFlag = container.querySelector('[data-testid="feature-flag"]');
      expect(featureFlag).toBeInTheDocument();
    });

    it('should display correct description', () => {
      render(<Issues />);

      expect(
        screen.getByText('Summary of issues in your Konflux content at any given point in time'),
      ).toBeInTheDocument();
    });

    it('should configure 2 tabs', () => {
      const { container } = render(<Issues />);

      const tabsCount = container.querySelector('[data-testid="tabs-count"]');
      expect(tabsCount).toHaveTextContent('2');
    });
  });

  describe('when issues-dashboard feature flag is disabled', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);
    });

    it('should not render anything when feature flag is disabled', () => {
      const { container } = render(<Issues />);

      expect(container.firstChild).toBeNull();
      expect(container.querySelector('[data-testid="details-page"]')).not.toBeInTheDocument();
    });
  });
});
