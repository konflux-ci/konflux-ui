import { screen, fireEvent } from '@testing-library/react';
import { mockedValidBannerConfig } from '~/components/KonfluxBanner/__data__/banner-data';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useActiveRouteChecker } from '../../hooks/useActiveRouteChecker';
import { createK8sUtilMock, routerRenderer } from '../../utils/test-utils';
import { AppRoot } from '../AppRoot';

jest.mock('../../hooks/useActiveRouteChecker', () => ({
  useActiveRouteChecker: jest.fn(),
}));
// This mock ensures different features have different status
jest.mock('~/feature-flags/hooks', () => {
  const mockFn = jest.fn();
  return {
    useIsOnFeatureFlag: mockFn,
    IfFeature: ({ flag, children }: { flag: string; children: React.ReactNode }) => {
      const isEnabled = mockFn(flag);
      return isEnabled ? children : null;
    },
    createConditionsHook: jest.fn(),
  };
});
jest.mock('../../shared/providers/Namespace/NamespaceSwitcher', () => ({
  NamespaceSwitcher: jest.fn(() => <div data-test="namespace-switcher" />),
}));

const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

// Mock window.matchMedia for PatternFly components to fix:
// TypeError: window.matchMedia is not a function
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('AppRoot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error: null });
    // Default: enable system-notifications feature flag for tests
    mockUseIsOnFeatureFlag.mockImplementation((flag: string) => {
      return flag === 'system-notifications';
    });
  });

  it('should render banner when useBanner returns a banner', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    k8sWatchMock.mockReturnValue({ data: mockedValidBannerConfig, isLoading: false, error: null });
    routerRenderer(<AppRoot />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should render AppRoot with header and sidebar', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);

    routerRenderer(<AppRoot />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('should toggle sidebar when header button is clicked', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);

    routerRenderer(<AppRoot />);

    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sidebar-toggle'));
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should show NamespaceSwitcher when route is not restricted', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue((route: string) => {
      return route === '/some-other-route';
    });

    routerRenderer(<AppRoot />);

    expect(screen.getByTestId('namespace-switcher')).toBeInTheDocument();
  });

  it('should not show NamespaceSwitcher on restricted routes', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue((route: string) => {
      return route === '/' || route === '/namespaces';
    });

    routerRenderer(<AppRoot />);

    expect(screen.queryByTestId('namespace-switcher')).not.toBeInTheDocument();
  });

  it('should show notification badge when feature flag is enabled', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    // Enable system-notifications feature flag
    mockUseIsOnFeatureFlag.mockImplementation((flag: string) => flag === 'system-notifications');

    routerRenderer(<AppRoot />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('should not show notification badge when feature flag is disabled', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    // Disable system-notifications feature flag
    mockUseIsOnFeatureFlag.mockImplementation(() => false);

    routerRenderer(<AppRoot />);
    expect(screen.queryByLabelText('Notifications')).not.toBeInTheDocument();
  });

  it('should show notification drawer when feature flag is enabled and opened', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    // Enable system-notifications feature flag
    mockUseIsOnFeatureFlag.mockImplementation((flag: string) => flag === 'system-notifications');

    routerRenderer(<AppRoot />);

    const notificationButton = screen.getByLabelText('Notifications');
    fireEvent.click(notificationButton);

    // Check that the notification drawer content is visible
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(document.querySelector('.pf-v5-c-notification-drawer__list')).toBeInTheDocument();
  });
});

// -----------------------------------------------------------------------------
// Additional coverage: Jest + React Testing Library
// Focus: diff-adjacent behaviors — banner loading/error states and notification drawer toggle edge cases
// -----------------------------------------------------------------------------

describe('AppRoot - additional scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks, aligned with the primary suite
    k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error: null });
    mockUseIsOnFeatureFlag.mockImplementation((flag: string) => flag === 'system-notifications');
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
  });

  it('does not render banner while banner config is loading', () => {
    k8sWatchMock.mockReturnValue({ data: null, isLoading: true, error: null });

    routerRenderer(<AppRoot />);

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    // Core layout should still render
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('does not render banner when fetching banner config fails', () => {
    k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error: new Error('fetch failed') });

    routerRenderer(<AppRoot />);

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    // Core layout resilient to banner errors
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('toggles the notification drawer open and closed when the feature flag is enabled', () => {
    mockUseIsOnFeatureFlag.mockImplementation((flag: string) => flag === 'system-notifications');

    routerRenderer(<AppRoot />);

    const notificationButton = screen.getByLabelText('Notifications');
    // Open
    fireEvent.click(notificationButton);
    expect(document.querySelector('.pf-v5-c-notification-drawer__list')).toBeInTheDocument();

    // Close (toggle again)
    fireEvent.click(notificationButton);
    expect(document.querySelector('.pf-v5-c-notification-drawer__list')).not.toBeInTheDocument();
  });

  it('does not render notifications UI if only unrelated feature flags are enabled', () => {
    // Enable an unrelated flag; keep system-notifications disabled
    mockUseIsOnFeatureFlag.mockImplementation((flag: string) => flag === 'some-other-flag');

    routerRenderer(<AppRoot />);

    expect(screen.queryByLabelText('Notifications')).not.toBeInTheDocument();
  });

  it('renders base layout even when banner watch errors (resilience test)', () => {
    k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error: new Error('boom') });

    routerRenderer(<AppRoot />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});
