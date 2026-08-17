import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KUBECTL_LIST_CONTEXTS_COMMAND } from '../cli-login-utils';
import { CliLoginModal } from '../CliLoginModal';
import { useCliLogin } from '../useCliLogin';

jest.mock('../useCliLogin');

const useCliLoginMock = useCliLogin as jest.Mock;

describe('CliLoginModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading skeleton while the CLI login info has not loaded', () => {
    useCliLoginMock.mockReturnValue([null, false, null]);

    render(<CliLoginModal />);

    expect(screen.getByLabelText('Loading CLI login details')).toBeInTheDocument();
  });

  it('renders a warning when CLI login is not available', () => {
    useCliLoginMock.mockReturnValue([null, true, null]);

    render(<CliLoginModal />);

    expect(screen.getByText(/CLI login is not available for this cluster/i)).toBeInTheDocument();
  });

  it('renders an error when cluster information cannot be retrieved', () => {
    useCliLoginMock.mockReturnValue([null, true, new Error('boom')]);

    render(<CliLoginModal />);

    expect(screen.getByText(/Unable to load CLI login details/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/CLI login is not available for this cluster/i),
    ).not.toBeInTheDocument();
  });

  it('shows the oc login command for OpenShift', () => {
    useCliLoginMock.mockReturnValue([
      {
        apiServerUrl: 'https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443',
        oauthTokenRequestUrl:
          'https://oauth-openshift.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com/oauth/token/request',
        namespace: 'my-tenant',
        authMode: 'openshift',
        loginCommand:
          'oc login https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443 --web -n my-tenant',
      },
      true,
      null,
    ]);

    render(<CliLoginModal />);

    expect(screen.getByText(/Copy login command to log in with oc:/i)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'oc login https://api.stone-stg-rh01.l2vh.p1.openshiftapps.com:6443 --web -n my-tenant',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Use your existing kubeconfig/i)).not.toBeInTheDocument();
  });

  it('shows a cluster-only oc login command when the user is not in a tenant', () => {
    useCliLoginMock.mockReturnValue([
      {
        apiServerUrl: 'https://api.example.com:6443',
        oauthTokenRequestUrl: 'https://oauth.example.com/oauth/token/request',
        namespace: '',
        authMode: 'openshift',
        loginCommand: 'oc login https://api.example.com:6443 --web',
      },
      true,
      null,
    ]);

    render(<CliLoginModal />);

    expect(
      screen.getByDisplayValue('oc login https://api.example.com:6443 --web'),
    ).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/ -n /)).not.toBeInTheDocument();
  });

  it('shows the kubectl command immediately', () => {
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

    render(<CliLoginModal />);

    expect(
      screen.getByText(/Copy login command to configure kubectl for this cluster:/i),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'kubectl config use-context kind-konflux && kubectl config set-context --current --namespace=my-tenant',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/127\.0\.0\.1:37689/)).toBeInTheDocument();
  });

  it('describes the kubectl fallback as listing contexts, not logging in', () => {
    useCliLoginMock.mockReturnValue([
      {
        apiServerUrl: 'https://127.0.0.1:37689',
        namespace: '',
        authMode: 'kubernetes',
        loginCommand: KUBECTL_LIST_CONTEXTS_COMMAND,
      },
      true,
      null,
    ]);

    render(<CliLoginModal />);

    expect(
      screen.getByText(
        /Copy login command to list the available kubectl contexts for this cluster:/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(KUBECTL_LIST_CONTEXTS_COMMAND)).toBeInTheDocument();
  });

  it('shows a cluster-only kubectl command when the user is not in a tenant', () => {
    useCliLoginMock.mockReturnValue([
      {
        apiServerUrl: 'https://127.0.0.1:37689',
        namespace: '',
        authMode: 'kubernetes',
        loginCommand: 'kubectl config use-context kind-konflux',
      },
      true,
      null,
    ]);

    render(<CliLoginModal />);

    expect(screen.getByDisplayValue('kubectl config use-context kind-konflux')).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue(/set-context --current --namespace=/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Copy login command to configure kubectl for this cluster:/i),
    ).toBeInTheDocument();
  });
});
