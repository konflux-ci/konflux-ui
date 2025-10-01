import { screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock shared hooks since KonfluxBanner now uses them
jest.mock('../../shared/hooks', () => ({
  useResizeObserver: jest.fn((callback, element) => {
    // Call the callback immediately if element exists to simulate resize observer
    if (element && callback) {
      setTimeout(() => callback(), 0);
    }
  }),
  useForceRender: jest.fn(() => jest.fn()),
  useQueryParams: jest.fn(),
  useScrollContainer: jest.fn(),
  useScrollShadows: jest.fn(),
  useDeepCompareMemoize: jest.fn(),
  useMutationObserver: jest.fn(),
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

  it('should set CSS custom property when banner is present', async () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    k8sWatchMock.mockReturnValue({ data: mockedValidBannerConfig, isLoading: false, error: null });

    // Mock document.documentElement.style.setProperty
    const mockSetProperty = jest.spyOn(document.documentElement.style, 'setProperty');

    // Create a mock element with offsetHeight before rendering
    const mockElement = document.createElement('div');
    mockElement.id = 'konflux-banner';
    Object.defineProperty(mockElement, 'offsetHeight', {
      configurable: true,
      value: 60,
    });

    // Mock getElementById to return our mock element
    const mockGetElementById = jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

    routerRenderer(<AppRoot />);

    // Wait for the CSS custom property to be set
    await waitFor(() => {
      expect(mockSetProperty).toHaveBeenCalledWith('--konflux-banner-height', '60px');
    });

    mockSetProperty.mockRestore();
    mockGetElementById.mockRestore();
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
