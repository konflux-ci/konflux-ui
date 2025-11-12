import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import Issues from '../Issues';

// Mock only the feature flag hooks
jest.mock('../../../feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
  useFeatureFlags: jest.fn(),
  IfFeature: ({ children, flag }: { children: React.ReactNode; flag: string }) => {
    const { useIsOnFeatureFlag } = jest.requireMock('../../../feature-flags/hooks');
    const isEnabled = useIsOnFeatureFlag(flag);
    return isEnabled ? <>{children}</> : null;
  },
}));

// Mock react-router-dom since DetailsPage uses it
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/issues', state: null, search: '', hash: '', key: 'default' }),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  useResolvedPath: () => ({ pathname: '/issues' }),
}));

// Mock useDocumentTitle hook used by TabsLayout
jest.mock('../../../hooks/useDocumentTitle', () => ({
  useDocumentTitle: jest.fn(),
}));

const { useIsOnFeatureFlag, useFeatureFlags } = jest.requireMock('../../../feature-flags/hooks');
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseFeatureFlags = useFeatureFlags as jest.Mock;

describe('Issues Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for useFeatureFlags - returns empty flags object and a setter function
    mockUseFeatureFlags.mockReturnValue([{}, jest.fn()]);
  });

  describe('when issues-dashboard feature flag is enabled', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
    });

    it('should render the Issues page with correct content', () => {
      render(
        <MemoryRouter initialEntries={['/issues']}>
          <Issues />
        </MemoryRouter>,
      );

      // Test user-visible content
      expect(screen.getByRole('heading', { name: /Issues/i })).toBeInTheDocument();
      expect(
        screen.getByText('Summary of issues in your Konflux content at any given point in time'),
      ).toBeInTheDocument();

      // Test tabs are rendered (user-visible)
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Issues/i })).toBeInTheDocument();
    });
  });

  describe('when issues-dashboard feature flag is disabled', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);
    });

    it('should not render anything when feature flag is disabled', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/issues']}>
          <Issues />
        </MemoryRouter>,
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
