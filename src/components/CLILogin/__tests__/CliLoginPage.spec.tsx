import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CliLoginPage from '../CliLoginPage';
import { useCliLogin } from '../useCliLogin';

jest.mock('../useCliLogin');

const useCliLoginMock = useCliLogin as jest.Mock;

describe('CliLoginPage', () => {
  const originalLocation = window.location;
  const replaceMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    replaceMock.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace: replaceMock },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('renders a loading skeleton while the CLI login info has not loaded', () => {
    useCliLoginMock.mockReturnValue([null, false, null]);

    render(<CliLoginPage />);

    expect(screen.getByTestId('cli-login-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Display Token/i })).not.toBeInTheDocument();
  });

  it('renders a warning when CLI login is not available', () => {
    useCliLoginMock.mockReturnValue([null, true, null]);

    render(<CliLoginPage />);

    expect(screen.getByTestId('cli-login-not-configured')).toBeInTheDocument();
    expect(screen.getByText(/CLI login is not available for this cluster/i)).toBeInTheDocument();
    expect(screen.getByText(/konflux-public-info/i)).toBeInTheDocument();
    expect(screen.getByText(/konflux-operator/i)).toBeInTheDocument();
    expect(screen.getByText(/\*\.apps\.\*/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Display Token/i })).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('renders an error when cluster information cannot be retrieved', () => {
    useCliLoginMock.mockReturnValue([null, true, new Error('boom')]);

    render(<CliLoginPage />);

    expect(screen.getByTestId('cli-login-error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load CLI login details/i)).toBeInTheDocument();
    expect(screen.queryByTestId('cli-login-not-configured')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Display Token/i })).not.toBeInTheDocument();
  });

  it('redirects to the OpenShift OAuth token request page when configured', () => {
    const oauthTokenRequestUrl =
      'https://oauth-openshift.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/oauth/token/request';
    useCliLoginMock.mockReturnValue([
      {
        apiServerUrl: 'https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443',
        oauthTokenRequestUrl,
        namespace: 'my-tenant',
        authMode: 'openshift',
        loginCommand:
          'oc login https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443 --web -n my-tenant',
      },
      true,
      null,
    ]);

    render(<CliLoginPage />);

    expect(replaceMock).toHaveBeenCalledWith(oauthTokenRequestUrl);
    expect(screen.getByTestId('cli-login-oauth-redirect')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Display Token/i })).not.toBeInTheDocument();
  });

  it('shows Display Token first, then the login command after it is clicked', async () => {
    const user = userEvent.setup();
    useCliLoginMock.mockReturnValue([
      {
        apiServerUrl: 'https://127.0.0.1:37689',
        namespace: 'my-tenant',
        authMode: 'kubernetes',
        loginCommand:
          'kubectl config use-context kind-konflux && kubectl config set-context --current --namespace=my-tenant',
      },
      true,
      null,
    ]);

    render(<CliLoginPage />);

    expect(screen.getByRole('button', { name: /Display Token/i })).toBeInTheDocument();
    expect(screen.queryByTestId('cli-login-command')).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Display Token/i }));

    expect(screen.getByText(/Log in with this token/i)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'kubectl config use-context kind-konflux && kubectl config set-context --current --namespace=my-tenant',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/127\.0\.0\.1:37689/)).toBeInTheDocument();
    expect(screen.getByText(/Use your existing kubeconfig for this cluster/i)).toBeInTheDocument();
    expect(screen.queryByText(/OpenShift/i)).not.toBeInTheDocument();
  });

  it('shows the oc login command after Display Token when OAuth is not configured', async () => {
    const user = userEvent.setup();
    useCliLoginMock.mockReturnValue([
      {
        apiServerUrl: 'https://api.example.com:6443',
        namespace: 'my-tenant',
        authMode: 'openshift',
        loginCommand: 'oc login https://api.example.com:6443 --web -n my-tenant',
      },
      true,
      null,
    ]);

    render(<CliLoginPage />);

    expect(replaceMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /Display Token/i }));

    expect(screen.getByText(/Log in with this token/i)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('oc login https://api.example.com:6443 --web -n my-tenant'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Use your existing kubeconfig for this cluster/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('cli-login-oauth-redirect')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Request another token/i }));

    expect(screen.getByRole('button', { name: /Display Token/i })).toBeInTheDocument();
    expect(screen.queryByTestId('cli-login-command')).not.toBeInTheDocument();
  });
});
