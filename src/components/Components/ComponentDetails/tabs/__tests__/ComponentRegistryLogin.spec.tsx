import { screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '~/utils/test-utils';
import ComponentRegistryLogin from '../ComponentRegistryLogin';
import { useRegistryLoginUrl } from '../useRegistryLoginUrl';

jest.mock('../useRegistryLoginUrl');

const useRegistryLoginUrlMock = useRegistryLoginUrl as jest.Mock;

describe('ComponentRegistryLogin', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show skeleton while loading', () => {
    useRegistryLoginUrlMock.mockReturnValue([null, false, null]);

    renderWithQueryClientAndRouter(<ComponentRegistryLogin />);

    expect(screen.getByTestId('registry-login-skeleton')).toBeInTheDocument();
  });

  it('should show error state when there is an error', () => {
    const error = { code: 500, message: 'Internal server error' };
    useRegistryLoginUrlMock.mockReturnValue([null, true, error]);

    renderWithQueryClientAndRouter(<ComponentRegistryLogin />);

    expect(screen.getByText(/Unable to load registry login URL/i)).toBeInTheDocument();
  });

  it('should show warning when domain is not configured', () => {
    useRegistryLoginUrlMock.mockReturnValue([null, true, null]);

    renderWithQueryClientAndRouter(<ComponentRegistryLogin />);

    const warning = screen.getByTestId('registry-login-not-configured');
    expect(warning).toBeInTheDocument();
    expect(screen.getByText('Registry domain not configured')).toBeInTheDocument();
  });

  it('should display link with correct URL when domain is configured', () => {
    const mockUrl =
      'https://oauth-openshift.apps.kflux-ocp-p01.7ayg.p1.openshiftapps.com/oauth/token/request';
    useRegistryLoginUrlMock.mockReturnValue([mockUrl, true, null]);

    renderWithQueryClientAndRouter(<ComponentRegistryLogin />);

    const link = screen.getByRole('link', { name: /Copy Login cmd/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', mockUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
