import React from 'react';
import { render, screen } from '@testing-library/react';
import Issues from '../Issues';

// Mock only the feature flag hooks
jest.mock('../../../feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
  IfFeature: ({ children, flag }: { children: React.ReactNode; flag: string }) => {
    const { useIsOnFeatureFlag } = jest.requireMock('../../../feature-flags/hooks');
    const isEnabled = useIsOnFeatureFlag(flag);
    return isEnabled ? <>{children}</> : null;
  },
}));

// Mock react-router-dom since DetailsPage uses it
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ state: null }),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

// Mock useDocumentTitle hook used by TabsLayout
jest.mock('../../../hooks/useDocumentTitle', () => ({
  useDocumentTitle: jest.fn(),
}));

const { useIsOnFeatureFlag } = jest.requireMock('../../../feature-flags/hooks');
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

describe('Issues Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when issues-dashboard feature flag is enabled', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
    });

    it('should render the Issues page with correct content', () => {
      render(<Issues />);

      // Test user-visible content
      expect(screen.getByRole('heading', { name: /Issues/i })).toBeInTheDocument();
      expect(
        screen.getByText('Summary of issues in your Konflux content at any given point in time'),
      ).toBeInTheDocument();

      // Test tabs are rendered (user-visible)
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Issues')).toBeInTheDocument();
    });
  });

  describe('when issues-dashboard feature flag is disabled', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);
    });

    it('should not render anything when feature flag is disabled', () => {
      const { container } = render(<Issues />);
      expect(container.firstChild).toBeNull();
    });
  });
});
