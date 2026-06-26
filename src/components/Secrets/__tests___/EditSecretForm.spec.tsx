import { useLocation, useNavigate } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent, type UserEvent } from '@testing-library/user-event';
import { Base64 } from 'js-base64';
import { SECRET_LIST_PATH } from '@routes/paths';
import {
  mockImageSecretDockerconfigjsonForEdit,
  mockImageSecretDockerconfigjsonMultiForEdit,
  mockImageSecretDockercfgForEdit,
  mockOpaqueSecretForEdit,
  mockSourceSecretBasicAuthForEdit,
  mockSourceSecretSSHForEdit,
} from '~/components/Secrets/__data__/mock-secrets';
import EditSecretForm from '~/components/Secrets/SecretsForm/EditSecretForm';
import { useSecretMetadata } from '~/hooks/useSecretMetadata';
import {
  SecretKind,
  SecretLabels,
  SecretType,
  SecretTypeDropdownLabel,
  SourceSecretType,
} from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';

jest.mock('react-router-dom', () => {
  const mockUseNavigate = jest.fn();
  const mockUseLocation = jest.fn();
  const useSearchParams = jest.fn(() => {
    const location = mockUseLocation() as { search?: string };
    const search = typeof location?.search === 'string' ? location.search : '';
    return [new URLSearchParams(search), jest.fn()];
  });
  return {
    useNavigate: mockUseNavigate,
    useLocation: mockUseLocation,
    useSearchParams,
  };
});

jest.mock('~/hooks/useSecretMetadata', () => ({
  useSecretMetadata: jest.fn(),
}));

jest.mock('~/utils/secrets/secret-utils', () => {
  const actual = jest.requireActual('~/utils/secrets/secret-utils');
  return {
    ...actual,
    getSecretBreadcrumbs: jest.fn(() => []),
    editSecretResource: jest.fn(),
    fetchFullSecret: jest.fn(),
  };
});

const useNavigateMock = useNavigate as jest.Mock;
const useLocationMock = useLocation as jest.Mock;
const useSecretMetadataMock = useSecretMetadata as jest.Mock;
const { editSecretResource, fetchFullSecret } = jest.requireMock('~/utils/secrets/secret-utils');

function stripSecretToMetadataOnly(full: SecretKind): SecretKind {
  const k8sType = full.type ?? '';
  const scmAuth =
    full.type === SecretType.sshAuth
      ? { [SecretLabels.SOURCE_AUTH_KIND_LABEL]: 'ssh' }
      : full.type === SecretType.basicAuth
        ? { [SecretLabels.SOURCE_AUTH_KIND_LABEL]: 'basic' }
        : {};
  return {
    apiVersion: full.apiVersion,
    kind: full.kind,
    metadata: {
      ...full.metadata,
      labels: {
        ...full.metadata?.labels,
        [SecretLabels.K8S_TYPE_LABEL]: k8sType,
        ...scmAuth,
      },
    },
    type: full.type,
  };
}

describe('EditSecretForm', () => {
  let navigateMock: jest.Mock;

  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    (editSecretResource as jest.Mock).mockReset();
    (fetchFullSecret as jest.Mock).mockReset();
  });

  const renderWithSecret = (secretData: SecretKind) => {
    useLocationMock.mockReturnValue({
      search: `?secretName=${secretData.metadata.name}`,
    });
    useSecretMetadataMock.mockReturnValue([stripSecretToMetadataOnly(secretData), true, null]);
    (fetchFullSecret as jest.Mock).mockResolvedValue(secretData);
    return render(<EditSecretForm />);
  };

  const expectSensitiveValuesBannerHidden = () => {
    expect(screen.getByText('Sensitive values are hidden')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show values' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hide values' })).not.toBeInTheDocument();
  };

  const expectSensitiveValuesBannerVisible = () => {
    expect(screen.getByText('Sensitive values are visible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide values' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show values' })).not.toBeInTheDocument();
  };

  const showSecretValues = async (user: UserEvent) => {
    await user.click(screen.getByRole('button', { name: 'Show values' }));
  };

  const hideSecretValues = async (user: UserEvent) => {
    await user.click(screen.getByRole('button', { name: 'Hide values' }));
  };

  describe('loading and error states', () => {
    it('shows spinner while secret is loading', () => {
      useLocationMock.mockReturnValue({ search: '?secretName=opaque-secret' });
      useSecretMetadataMock.mockReturnValue([undefined, false, null]);

      render(<EditSecretForm />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Edit secret' })).not.toBeInTheDocument();
    });

    it('does not render edit form when useSecretMetadata returns error', () => {
      const mockError = new Error('Secret not found');
      useLocationMock.mockReturnValue({ search: '?secretName=missing-secret' });
      useSecretMetadataMock.mockReturnValue([undefined, true, mockError]);

      render(<EditSecretForm />);

      expect(screen.queryByRole('heading', { name: 'Edit secret' })).not.toBeInTheDocument();
    });
  });

  describe('rendering for each secret type', () => {
    it('renders edit form with opaque (key/value) secret', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockOpaqueSecretForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('opaque-secret')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-toggle')[0]).toHaveTextContent(
        SecretTypeDropdownLabel.opaque,
      );
      expectSensitiveValuesBannerHidden();
      await showSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(screen.getByDisplayValue('key1')).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('key2')).toBeInTheDocument();
      expect(screen.getByText(/Key\/value 1/)).toBeInTheDocument();
      expect(screen.getByText(/Key\/value 2/)).toBeInTheDocument();
    });

    it('renders edit form with image pull secret (Image registry credentials)', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockImageSecretDockerconfigjsonForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('image-secret-dockerconfigjson')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-toggle')[0]).toHaveTextContent(
        SecretTypeDropdownLabel.image,
      );
      expect(screen.getByText('Authentication type')).toBeInTheDocument();
      expect(screen.getAllByText('Image registry credentials').length).toBeGreaterThan(0);
      expectSensitiveValuesBannerHidden();
      await showSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(screen.getByDisplayValue('registry.example.com')).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('reguser')).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/)).toHaveValue('regpass');
      expect(screen.getByDisplayValue('reg@example.com')).toBeInTheDocument();
    });

    it('renders edit form with image pull secret (Upload configuration file)', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockImageSecretDockercfgForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('image-secret-dockercfg')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-toggle')[0]).toHaveTextContent(
        SecretTypeDropdownLabel.image,
      );
      expect(screen.getByText('Authentication type')).toBeInTheDocument();
      expectSensitiveValuesBannerHidden();

      await showSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(fetchFullSecret).toHaveBeenCalled();
        expect(screen.getByText(/Upload a .dockercfg or .docker/)).toBeInTheDocument();
      });

      const dockerConfigField = document.getElementById('text-file-docker-config');
      const dockerConfigInput =
        dockerConfigField?.querySelector('input, textarea') ?? dockerConfigField;
      expect(dockerConfigInput).toBeInTheDocument();
      expect((dockerConfigInput as HTMLInputElement | HTMLTextAreaElement).value).toContain(
        Base64.decode(mockImageSecretDockercfgForEdit.data['.dockercfg']),
      );
    });

    it('renders edit form with source secret (Basic authentication)', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockSourceSecretBasicAuthForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('source-secret-basic')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-toggle')[0]).toHaveTextContent(
        SecretTypeDropdownLabel.source,
      );
      expect(screen.getByText('Authentication type')).toBeInTheDocument();
      expect(screen.getByText(SourceSecretType.basic)).toBeInTheDocument();
      expectSensitiveValuesBannerHidden();
      await showSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(screen.getByDisplayValue('gituser')).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/^Host/)).toHaveValue('github.com');
      expect(screen.getByLabelText(/^Repository/)).toHaveValue('org/repo');
      expect(screen.getByLabelText(/Password/)).toHaveValue('gitpass');
    });

    it('renders edit form with source secret (SSH Key)', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockSourceSecretSSHForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('source-secret-ssh')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-toggle')[0]).toHaveTextContent(
        SecretTypeDropdownLabel.source,
      );
      expect(screen.getByText('Authentication type')).toBeInTheDocument();
      expect(screen.getByLabelText(/^Host/)).toHaveValue('gitlab.com');
      expect(screen.getByLabelText(/^Repository/)).toHaveValue('group/project');
      expectSensitiveValuesBannerHidden();
      await showSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(screen.getByText('SSH private key')).toBeInTheDocument();
        const sshKeyField = document.getElementById('text-file-ssh');
        const sshKeyInput = sshKeyField?.querySelector('input, textarea') ?? sshKeyField;
        expect(sshKeyInput).toBeInTheDocument();
        expect((sshKeyInput as HTMLInputElement | HTMLTextAreaElement).value).not.toBe('');
      });
    });
  });

  describe('sensitive values toggle', () => {
    it('shows loading state while fetching secret values', async () => {
      let resolveFetch: (value: SecretKind) => void = () => undefined;

      const user = userEvent.setup();
      useLocationMock.mockReturnValue({
        search: `?secretName=${mockOpaqueSecretForEdit.metadata.name}`,
      });
      useSecretMetadataMock.mockReturnValue([
        stripSecretToMetadataOnly(mockOpaqueSecretForEdit),
        true,
        null,
      ]);
      (fetchFullSecret as jest.Mock).mockImplementation(
        () =>
          new Promise<SecretKind>((resolve) => {
            resolveFetch = resolve;
          }),
      );
      render(<EditSecretForm />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Show values' }));

      await waitFor(() => {
        expect(screen.getByText('Loading sensitive values...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Loading...' })).toHaveAttribute(
          'aria-disabled',
          'true',
        );
        expect(screen.getByLabelText('Loading secret values')).toBeInTheDocument();
      });

      resolveFetch(mockOpaqueSecretForEdit);

      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(screen.getByDisplayValue('key1')).toBeInTheDocument();
      });
    });

    it('shows hidden banner by default and toggles opaque secret values', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockOpaqueSecretForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });

      expectSensitiveValuesBannerHidden();
      expect(screen.queryByDisplayValue('key1')).not.toBeInTheDocument();

      await showSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(screen.getByDisplayValue('key1')).toBeInTheDocument();
      });

      await hideSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerHidden();
        expect(screen.queryByDisplayValue('key1')).not.toBeInTheDocument();
      });
    });

    it('keeps revealed values visible after blurring a sensitive field', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockSourceSecretBasicAuthForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });

      await showSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(screen.getByDisplayValue('gituser')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      await user.click(passwordInput);
      await user.clear(passwordInput);
      await user.type(passwordInput, 'edited');
      await user.click(screen.getByLabelText(/^Host/));

      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(screen.getByDisplayValue('gituser')).toBeInTheDocument();
        expect(passwordInput).toHaveValue('edited');
      });
    });

    it('clears docker config from form state when hiding upload configuration values', async () => {
      const user = userEvent.setup();
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);
      renderWithSecret(mockImageSecretDockercfgForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(fetchFullSecret).toHaveBeenCalledTimes(1);
        const dockerConfigField = document.getElementById('text-file-docker-config');
        const dockerConfigInput =
          dockerConfigField?.querySelector('input, textarea') ?? dockerConfigField;
        expect((dockerConfigInput as HTMLInputElement | HTMLTextAreaElement).value).not.toBe('');
      });

      await hideSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerHidden();
        expect(document.getElementById('text-file-docker-config')).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-button'));
      const labelKeyInputs = screen.getAllByTestId('pairs-list-name');
      await user.type(labelKeyInputs[labelKeyInputs.length - 1], 'test-label');
      const labelValueInputs = screen.getAllByTestId('pairs-list-value');
      await user.type(labelValueInputs[labelValueInputs.length - 1], 'test-value');

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeDisabled();
      });
      expect(editSecretResource).not.toHaveBeenCalled();
    });

    it('clears sensitive form values when the document becomes hidden', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockSourceSecretBasicAuthForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expectSensitiveValuesBannerVisible();
        expect(screen.getByDisplayValue('gituser')).toBeInTheDocument();
      });

      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));

      await waitFor(() => {
        expectSensitiveValuesBannerHidden();
      });
    });
  });

  describe('edit mode behavior', () => {
    it('shows edit-mode helper text for secret name', async () => {
      renderWithSecret(mockOpaqueSecretForEdit);

      await waitFor(() => {
        expect(
          screen.getByText('You cannot edit the secret name in edit mode'),
        ).toBeInTheDocument();
      });
    });

    it('disables name input in edit mode', async () => {
      renderWithSecret(mockOpaqueSecretForEdit);

      await waitFor(() => {
        expect(screen.getByDisplayValue('opaque-secret')).toBeInTheDocument();
      });
      const nameInput = screen.getByDisplayValue('opaque-secret');
      expect(nameInput).toBeDisabled();
    });

    it('disables secret type dropdown in edit mode', async () => {
      renderWithSecret(mockOpaqueSecretForEdit);

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-toggle')).toBeInTheDocument();
      });
      const secretTypeToggle = screen.getAllByTestId('dropdown-toggle')[0];
      expect(secretTypeToggle).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('cancel and submit', () => {
    it('navigates back when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockOpaqueSecretForEdit);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith(-1);
      });
    });

    it('calls editSecretResource and navigates to list on successful submit (opaque)', async () => {
      const user = userEvent.setup();
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);

      renderWithSecret(mockOpaqueSecretForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expect(screen.getByDisplayValue('key1')).toBeInTheDocument();
      });

      // Make form dirty so submit is enabled
      const key1Input = screen.getByDisplayValue('key1');
      await user.clear(key1Input);
      await user.type(key1Input, 'key1-updated');
      await user.click(screen.getByRole('heading', { name: 'Edit secret' }));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(editSecretResource).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SecretTypeDropdownLabel.opaque,
            name: 'opaque-secret',
            opaque: expect.objectContaining({
              keyValues: expect.arrayContaining([
                expect.objectContaining({ key: 'key1-updated' }),
                expect.objectContaining({ key: 'key2' }),
              ]),
            }),
          }),
          'test-ns',
          mockOpaqueSecretForEdit,
        );
      });

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith(
          SECRET_LIST_PATH.createPath({ workspaceName: 'test-ns' }),
        );
      });
    });

    it('calls editSecretResource and navigates on successful submit (image dockerconfigjson)', async () => {
      const user = userEvent.setup();
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);

      renderWithSecret(mockImageSecretDockerconfigjsonForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expect(screen.getByDisplayValue('registry.example.com')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Password/i, { selector: 'input' });
      await user.clear(passwordInput);
      await user.type(passwordInput, 'newpass');

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(editSecretResource).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SecretTypeDropdownLabel.image,
            name: 'image-secret-dockerconfigjson',
            image: expect.objectContaining({
              authType: 'Image registry credentials',
              registryCreds: expect.arrayContaining([
                expect.objectContaining({
                  registry: 'registry.example.com',
                  username: 'reguser',
                  password: 'newpass',
                  email: 'reg@example.com',
                }),
              ]),
            }),
          }),
          'test-ns',
          mockImageSecretDockerconfigjsonForEdit,
        );
      });

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith(
          SECRET_LIST_PATH.createPath({ workspaceName: 'test-ns' }),
        );
      });
    });

    it('calls editSecretResource and navigates on successful submit (source basic auth) after entering password', async () => {
      const user = userEvent.setup();
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);

      renderWithSecret(mockSourceSecretBasicAuthForEdit);

      await showSecretValues(user);
      await waitFor(() => {
        expect(screen.getByDisplayValue('gituser')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      await user.clear(passwordInput);
      await user.type(passwordInput, 'newpassword');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(editSecretResource).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SecretTypeDropdownLabel.source,
            name: 'source-secret-basic',
            source: expect.objectContaining({
              authType: SourceSecretType.basic,
              username: 'gituser',
              password: 'newpassword',
              host: 'github.com',
              repo: 'org/repo',
            }),
          }),
          'test-ns',
          mockSourceSecretBasicAuthForEdit,
        );
      });

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith(
          SECRET_LIST_PATH.createPath({ workspaceName: 'test-ns' }),
        );
      });
    });

    it('does not show Required when source basic auth password is left blank in edit mode', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockSourceSecretBasicAuthForEdit);

      await showSecretValues(user);
      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText('Required')).not.toBeInTheDocument();
      });
    });

    it('calls editSecretResource with preserved source password when password left blank', async () => {
      const user = userEvent.setup();
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);

      renderWithSecret(mockSourceSecretBasicAuthForEdit);

      await waitFor(() => {
        expect(screen.getByLabelText(/^Host/)).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expect(screen.getByDisplayValue('gituser')).toBeInTheDocument();
      });
      const hostInput = screen.getByLabelText(/^Host/);
      await user.clear(hostInput);
      await user.type(hostInput, 'github.org');
      await user.click(screen.getByRole('heading', { name: 'Edit secret' }));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(editSecretResource).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SecretTypeDropdownLabel.source,
            name: 'source-secret-basic',
            source: expect.objectContaining({
              authType: SourceSecretType.basic,
              username: 'gituser',
              password: 'gitpass',
              host: 'github.org',
              repo: 'org/repo',
            }),
          }),
          'test-ns',
          mockSourceSecretBasicAuthForEdit,
        );
      });
    });

    it('calls editSecretResource with preserved registry password when image password left blank', async () => {
      const user = userEvent.setup();
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);

      renderWithSecret(mockImageSecretDockerconfigjsonForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expect(screen.getByDisplayValue('reguser')).toBeInTheDocument();
      });

      const usernameInput = screen.getByDisplayValue('reguser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'reguser-updated');
      await user.click(screen.getByRole('heading', { name: 'Edit secret' }));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(editSecretResource).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SecretTypeDropdownLabel.image,
            name: 'image-secret-dockerconfigjson',
            image: expect.objectContaining({
              authType: 'Image registry credentials',
              registryCreds: expect.arrayContaining([
                expect.objectContaining({
                  registry: 'registry.example.com',
                  username: 'reguser-updated',
                  password: 'regpass',
                  email: 'reg@example.com',
                }),
              ]),
            }),
          }),
          'test-ns',
          mockImageSecretDockerconfigjsonForEdit,
        );
      });
    });

    it('preserves both passwords when only the second registry credential username is changed', async () => {
      const user = userEvent.setup();
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);

      renderWithSecret(mockImageSecretDockerconfigjsonMultiForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expect(screen.getByDisplayValue('user-a')).toBeInTheDocument();
        expect(screen.getByDisplayValue('user-b')).toBeInTheDocument();
      });

      const userBInput = screen.getByDisplayValue('user-b');
      await user.clear(userBInput);
      await user.type(userBInput, 'user-b-updated');
      await user.click(screen.getByRole('heading', { name: 'Edit secret' }));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(editSecretResource).toHaveBeenCalledWith(
          expect.objectContaining({
            type: SecretTypeDropdownLabel.image,
            name: 'image-secret-dockerconfigjson-multi',
            image: expect.objectContaining({
              authType: 'Image registry credentials',
              registryCreds: [
                expect.objectContaining({
                  registry: 'registry-a.example.com',
                  username: 'user-a',
                  password: 'pass-a',
                  email: 'a@example.com',
                }),
                expect.objectContaining({
                  registry: 'registry-b.example.com',
                  username: 'user-b-updated',
                  password: 'pass-b',
                  email: 'b@example.com',
                }),
              ],
            }),
          }),
          'test-ns',
          mockImageSecretDockerconfigjsonMultiForEdit,
        );
      });
    });

    it('shows Required when image pull secret docker config field is touched and left empty', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockImageSecretDockercfgForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expect(fetchFullSecret).toHaveBeenCalled();
        expect(screen.getByRole('textbox', { name: 'File upload' })).toBeInTheDocument();
      });

      const configInput = screen.getByRole('textbox', { name: 'File upload' });
      await user.clear(configInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Required')).toBeInTheDocument();
      });

      expect(editSecretResource).not.toHaveBeenCalled();
    });

    it('shows JSON format error when image pull secret docker config is invalid JSON', async () => {
      const user = userEvent.setup();
      renderWithSecret(mockImageSecretDockercfgForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expect(fetchFullSecret).toHaveBeenCalled();
        expect(screen.getByRole('textbox', { name: 'File upload' })).toBeInTheDocument();
      });

      const configInput = screen.getByRole('textbox', { name: 'File upload' });
      await user.clear(configInput);
      await user.type(configInput, `not valid json ${'{{'.repeat(3)}`);

      await waitFor(() => {
        expect(
          screen.getByText('Configuration file should be in JSON format.'),
        ).toBeInTheDocument();
      });

      expect(editSecretResource).not.toHaveBeenCalled();
    });

    it('sets submit error and does not navigate when editSecretResource rejects', async () => {
      const user = userEvent.setup();
      (editSecretResource as jest.Mock).mockRejectedValue(new Error('Patch failed'));

      renderWithSecret(mockOpaqueSecretForEdit);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      await showSecretValues(user);
      await waitFor(() => {
        expect(screen.getByDisplayValue('key1')).toBeInTheDocument();
      });

      // Make form dirty so submit is enabled
      const key1Input = screen.getByDisplayValue('key1');
      await user.clear(key1Input);
      await user.type(key1Input, 'key1-x');
      await user.click(screen.getByRole('heading', { name: 'Edit secret' }));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByText('Patch failed')).toBeInTheDocument();
      });

      expect(navigateMock).not.toHaveBeenCalledWith(
        SECRET_LIST_PATH.createPath({ workspaceName: 'test-ns' }),
      );
    });
  });
});
