import React from 'react';
import { screen } from '@testing-library/react';
import { useActiveRouteChecker } from '../../../src/hooks/useActiveRouteChecker';
import { useNamespace } from '../../shared/providers/Namespace';
import { routerRenderer } from '../../utils/test-utils';
import { AppSideBar } from '../AppSideBar';

jest.mock('../../../src/hooks/useActiveRouteChecker', () => ({
  useActiveRouteChecker: jest.fn(),
}));

jest.mock('../../shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

jest.mock('~/shared/components/SavedViews', () => ({
  SavedViewNavItems: () => null,
}));

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: () => true,
  IfFeature: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('~/feature-flags/FeatureFlagIndicator', () => ({
  FeatureFlagIndicator: () => null,
}));

jest.mock('~/kite/kite-hooks', () => ({
  useIssues: jest.fn(() => ({
    data: { data: [], total: 0, limit: 20, offset: 0 },
    isLoading: false,
    error: null,
  })),
  useInfiniteIssues: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
}));

describe('AppSideBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the sidebar', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should highlight the active route', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue((path) => path === '/');
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByText('Overview')).toHaveClass('active');
  });

  it('should disable namespace-dependent links when no namespace is selected', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue(null);

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(screen.getByText('Namespaces').closest('li')).not.toHaveClass(
      'app-side-bar__nav-item--disabled',
    );

    expect(screen.getByText('Applications').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('Issues').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('Pipeline Runs').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('Secrets').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('Releases').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('User Access').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
  });

  it('should generate correct links when namespace is selected', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(screen.getByText('Applications')).toHaveAttribute(
      'href',
      '/ns/test-namespace/applications',
    );
    expect(screen.getByText('Issues')).toHaveAttribute('href', '/ns/test-namespace/issues');
    expect(screen.getByText('Pipeline Runs')).toHaveAttribute('href', '/ns/test-namespace/prns');
    expect(screen.getByText('Secrets')).toHaveAttribute('href', '/ns/test-namespace/secrets');
    expect(screen.getByText('Releases')).toHaveAttribute('href', '/ns/test-namespace/release');
    expect(screen.getByText('User Access')).toHaveAttribute('href', '/ns/test-namespace/access');
  });

  it('should render the Pipeline Runs nav item', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
  });

  it('should have correct href for Pipeline Runs when namespace is selected', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByText('Pipeline Runs')).toHaveAttribute('href', '/ns/test-namespace/prns');
  });

  it('should disable Pipeline Runs when no namespace is selected', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue(null);

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByText('Pipeline Runs').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
  });

  it('should not render links for disabled namespace-dependent routes when no namespace is available', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue(null);

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(screen.getByText('Namespaces')).toHaveAttribute('href', '/ns');
    expect(screen.getByText('Applications')).toHaveAttribute('href', '/');
    expect(screen.getByText('Issues')).toHaveAttribute('href', '/');
    expect(screen.getByText('Pipeline Runs')).toHaveAttribute('href', '/');
    expect(screen.getByText('Secrets')).toHaveAttribute('href', '/');
    expect(screen.getByText('Releases')).toHaveAttribute('href', '/');
    expect(screen.getByText('User Access')).toHaveAttribute('href', '/');
  });
});
