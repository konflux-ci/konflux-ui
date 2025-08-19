import { screen, fireEvent } from '@testing-library/react';
import { mockedValidBannerConfig } from '~/components/KonfluxBanner/__data__/banner-data';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useActiveRouteChecker } from '../../hooks/useActiveRouteChecker';
import { createK8sUtilMock, routerRenderer } from '../../utils/test-utils';
import { AppRoot } from '../AppRoot';

jest.mock('../../hooks/useActiveRouteChecker', () => ({
  useActiveRouteChecker: jest.fn(),
}));
jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
  IfFeature: ({ children }: { flag: string; children: React.ReactNode }) => children,
}));
jest.mock('../../shared/providers/Namespace/NamespaceSwitcher', () => ({
  NamespaceSwitcher: jest.fn(() => <div data-test="namespace-switcher" />),
}));
jest.mock('../../components/Header/Header', () => ({
  Header: ({
    isDrawerExpanded,
    toggleDrawer,
  }: {
    isDrawerExpanded: boolean;
    toggleDrawer: () => void;
  }) => (
    <div data-test="header">
      <button aria-label="Notifications" onClick={toggleDrawer} data-test="notification-toggle">
        Notifications {isDrawerExpanded ? 'Open' : 'Closed'}
      </button>
    </div>
  ),
}));
jest.mock('~/components/KonfluxSystemNotifications/NotificationList', () => ({
  __esModule: true,
  default: ({
    isDrawerExpanded,
    closeDrawer,
  }: {
    isDrawerExpanded: boolean;
    closeDrawer: () => void;
  }) => (
    <div data-test="notification-center" data-expanded={isDrawerExpanded}>
      <button onClick={closeDrawer} data-test="close-notifications">
        Close
      </button>
      Notification Center
    </div>
  ),
}));

const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

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

  it('should show notification badge', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);

    routerRenderer(<AppRoot />);
    expect(screen.getByLabelText('Notifications')).toBeVisible();
  });

  it('should toggle notification drawer when notification button is clicked', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);

    routerRenderer(<AppRoot />);

    const notificationToggle = screen.getByTestId('notification-toggle');
    expect(screen.queryByText('Notification Center')).not.toBeInTheDocument();
    // Click to open
    fireEvent.click(notificationToggle);
    expect(screen.getByText('Notification Center')).toBeVisible();
  });
});
