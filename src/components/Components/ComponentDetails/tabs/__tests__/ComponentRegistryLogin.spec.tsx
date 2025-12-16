import { screen } from '@testing-library/react';
import { useImageProxy } from '~/hooks/useImageProxy';
import { renderWithQueryClientAndRouter } from '~/utils/test-utils';
import ComponentRegistryLogin from '../ComponentRegistryLogin';

jest.mock('~/hooks/useImageProxy');

const useImageProxyMock = useImageProxy as jest.Mock;
describe('ComponentRegistryLogin', () => {
  it('should show skeleton while loading', () => {
    useImageProxyMock.mockReturnValue([null, false, null]);

    renderWithQueryClientAndRouter(<ComponentRegistryLogin />);

    expect(screen.getByTestId('registry-login-skeleton')).toBeInTheDocument();
  });

  it('should show error state when there is an error', () => {
    const error = { code: 500, message: 'Internal server error' };
    useImageProxyMock.mockReturnValue([null, true, error]);

    renderWithQueryClientAndRouter(<ComponentRegistryLogin />);

    expect(screen.getByText(/Unable to load registry login URL/i)).toBeInTheDocument();
  });

  it('should show warning when domain is not configured', () => {
    useImageProxyMock.mockReturnValue([null, true, null]);

    renderWithQueryClientAndRouter(<ComponentRegistryLogin />);

    const warning = screen.getByTestId('registry-login-not-configured');
    expect(warning).toBeInTheDocument();
    expect(screen.getByText('Registry domain not configured')).toBeInTheDocument();
  });

  it('should display authentication token link and login command when domain is configured', () => {
    const mockHost = 'registry.example.com';
    const mockUrlInfo = {
      fullUrl: `https://${mockHost}`,
      hostname: mockHost,
      oauthPath: '/oauth',
      buildUrl: (path: string) => `https://${mockHost}${path}`,
    };
    useImageProxyMock.mockReturnValue([mockUrlInfo, true, null]);

    renderWithQueryClientAndRouter(<ComponentRegistryLogin />);

    // Check for authentication token link
    const link = screen.getByRole('link', { name: /Get your authentication token/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `https://${mockHost}/oauth`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    // Check for clipboard copy with podman login command
    const clipboardInput = screen.getByDisplayValue(/podman login -u/i);
    expect(clipboardInput).toBeInTheDocument();
    expect(clipboardInput).toHaveValue(`podman login -u unused ${mockHost}`);
  });
});
