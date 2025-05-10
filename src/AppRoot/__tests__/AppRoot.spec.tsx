import { screen, fireEvent } from '@testing-library/react';
import { mockedValidBannerConfig } from '~/hooks/__data__/mock-data';
import { useActiveRouteChecker } from '../../hooks/useActiveRouteChecker';
import { createK8sUtilMock, routerRenderer } from '../../utils/test-utils';
import { AppRoot } from '../AppRoot';

jest.mock('../../hooks/useActiveRouteChecker', () => ({
  useActiveRouteChecker: jest.fn(),
}));
jest.mock('../../shared/providers/Namespace/NamespaceSwitcher', () => ({
  NamespaceSwitcher: jest.fn(() => <div data-test="namespace-switcher" />),
}));
const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');

describe('AppRoot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error: null });
  });

  it('should render banner when useBanner returns a banner', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    k8sWatchMock.mockReturnValue({ data: mockedValidBannerConfig, isLoading: false, error: null });
    routerRenderer(<AppRoot />);
    expect(screen.getByTestId('banner')).toBeInTheDocument();
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
});
