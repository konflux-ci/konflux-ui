import { useLocation, useNavigate } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Base64 } from 'js-base64';
import { SECRET_LIST_PATH } from '@routes/paths';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { SecretTypeDropdownLabel, SourceSecretType } from '../../../types';
import {
  mockImageSecretDockerconfigjsonForEdit,
  mockImageSecretDockercfgForEdit,
  mockOpaqueSecretForEdit,
  mockSourceSecretBasicAuthForEdit,
  mockSourceSecretSSHForEdit,
} from '../__data__/mock-secrets';
import EditSecretForm from '../SecretsForm/EditSecretForm';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock create-utils first to avoid circular dependency when loading secret-utils
jest.mock('~/utils/create-utils', () => ({
  createK8sSecretResource: jest.fn((_values: unknown, secretResource: unknown) => secretResource),
}));

jest.mock('~/utils/secrets/secret-utils', () => {
  const actual = jest.requireActual('~/utils/secrets/secret-utils');
  return {
    ...actual,
    getSecretBreadcrumbs: jest.fn(() => []),
    editSecretResource: jest.fn(),
  };
});

const useNavigateMock = useNavigate as jest.Mock;
const useLocationMock = useLocation as jest.Mock;
const { editSecretResource } = jest.requireMock('~/utils/secrets/secret-utils');

describe('EditSecretForm', () => {
  let navigateMock: jest.Mock;

  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    (editSecretResource as jest.Mock).mockReset();
  });

  const renderWithSecret = (secretData: ReturnType<typeof useLocation>['state']) => {
    useLocationMock.mockReturnValue({ state: secretData });
    return render(<EditSecretForm />);
  };

  describe('rendering for each secret type', () => {
    it('renders edit form with opaque (key/value) secret', async () => {
      renderWithSecret({ secretData: mockOpaqueSecretForEdit });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('opaque-secret')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-toggle')[0]).toHaveTextContent(
        SecretTypeDropdownLabel.opaque,
      );
      expect(screen.getByDisplayValue('key1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('key2')).toBeInTheDocument();
      expect(screen.getByText(/Key\/value 1/)).toBeInTheDocument();
      expect(screen.getByText(/Key\/value 2/)).toBeInTheDocument();
    });

    it('renders edit form with image pull secret (Image registry credentials)', async () => {
      renderWithSecret({ secretData: mockImageSecretDockerconfigjsonForEdit });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('image-secret-dockerconfigjson')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-toggle')[0]).toHaveTextContent(
        SecretTypeDropdownLabel.image,
      );
      expect(screen.getByText('Authentication type')).toBeInTheDocument();
      expect(screen.getAllByText('Image registry credentials').length).toBeGreaterThan(0);
      expect(screen.getByDisplayValue('registry.example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('reguser')).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/)).toHaveValue('');
      expect(screen.getByDisplayValue('reg@example.com')).toBeInTheDocument();
    });

    it('renders edit form with image pull secret (Upload configuration file)', async () => {
      renderWithSecret({ secretData: mockImageSecretDockercfgForEdit });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('image-secret-dockercfg')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-toggle')[0]).toHaveTextContent(
        SecretTypeDropdownLabel.image,
      );
      expect(screen.getByText('Authentication type')).toBeInTheDocument();
      expect(screen.getByText(/Upload a .dockercfg or .docker/)).toBeInTheDocument();

      // Check that the config is in area and is correctly decoded
      const dockerConfigField = document.getElementById('text-file-docker-config');
      const dockerConfigInput =
        dockerConfigField?.querySelector('input, textarea') ?? dockerConfigField;
      expect(dockerConfigInput).toBeInTheDocument();
      expect((dockerConfigInput as HTMLInputElement | HTMLTextAreaElement).value).toContain(
        Base64.decode(mockImageSecretDockercfgForEdit.data['.dockercfg']),
      );
    });

    it('renders edit form with source secret (Basic authentication)', async () => {
      renderWithSecret({ secretData: mockSourceSecretBasicAuthForEdit });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit secret' })).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('source-secret-basic')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-toggle')[0]).toHaveTextContent(
        SecretTypeDropdownLabel.source,
      );
      expect(screen.getByText('Authentication type')).toBeInTheDocument();
      expect(screen.getByText(SourceSecretType.basic)).toBeInTheDocument();
      expect(screen.getByDisplayValue('gituser')).toBeInTheDocument();
      expect(screen.getByLabelText(/^Host/)).toHaveValue('github.com');
      expect(screen.getByLabelText(/^Repository/)).toHaveValue('org/repo');
      expect(screen.getByLabelText(/Password/)).toHaveValue('');
    });

    it('renders edit form with source secret (SSH Key)', async () => {
      renderWithSecret({ secretData: mockSourceSecretSSHForEdit });

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
      expect(screen.getByText('SSH private key')).toBeInTheDocument();
      const sshKeyField = document.getElementById('text-file-ssh');
      const sshKeyInput = sshKeyField?.querySelector('input, textarea') ?? sshKeyField;
      expect(sshKeyInput).toBeInTheDocument();
      expect((sshKeyInput as HTMLInputElement | HTMLTextAreaElement).value).toBe('');
    });
  });

  describe('edit mode behavior', () => {
    it('shows edit-mode helper text for secret name', async () => {
      renderWithSecret({ secretData: mockOpaqueSecretForEdit });

      await waitFor(() => {
        expect(
          screen.getByText('You cannot edit the secret name in edit mode'),
        ).toBeInTheDocument();
      });
    });

    it('disables name input in edit mode', async () => {
      renderWithSecret({ secretData: mockOpaqueSecretForEdit });

      await waitFor(() => {
        expect(screen.getByDisplayValue('opaque-secret')).toBeInTheDocument();
      });
      const nameInput = screen.getByDisplayValue('opaque-secret');
      expect(nameInput).toBeDisabled();
    });

    it('disables secret type dropdown in edit mode', async () => {
      renderWithSecret({ secretData: mockOpaqueSecretForEdit });

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-toggle')).toBeInTheDocument();
      });
      const secretTypeToggle = screen.getAllByTestId('dropdown-toggle')[0];
      expect(secretTypeToggle).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('cancel and submit', () => {
    it('navigates back when Cancel is clicked', async () => {
      renderWithSecret({ secretData: mockOpaqueSecretForEdit });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      });

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith(-1);
      });
    });

    it('calls editSecretResource and navigates to list on successful submit (opaque)', async () => {
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);

      renderWithSecret({ secretData: mockOpaqueSecretForEdit });

      await waitFor(() => {
        expect(screen.getByDisplayValue('key1')).toBeInTheDocument();
      });

      // Make form dirty so submit is enabled
      const key1Input = screen.getByDisplayValue('key1');
      fireEvent.input(key1Input, { target: { value: 'key1-updated' } });
      fireEvent.blur(key1Input);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      act(() => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(editSecretResource).toHaveBeenCalledWith(
          mockOpaqueSecretForEdit,
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
        );
      });

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith(
          SECRET_LIST_PATH.createPath({ workspaceName: 'test-ns' }),
        );
      });
    });

    it('calls editSecretResource and navigates on successful submit (image dockerconfigjson)', async () => {
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);

      renderWithSecret({ secretData: mockImageSecretDockerconfigjsonForEdit });

      await waitFor(() => {
        expect(screen.getByDisplayValue('registry.example.com')).toBeInTheDocument();
      });

      // Fill password to satisfy validation and make form dirty
      const passwordInput = screen.getByLabelText(/Password/i, { selector: 'input' });
      fireEvent.input(passwordInput, { target: { value: 'newpass' } });

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      act(() => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(editSecretResource).toHaveBeenCalledWith(
          mockImageSecretDockerconfigjsonForEdit,
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
        );
      });

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith(
          SECRET_LIST_PATH.createPath({ workspaceName: 'test-ns' }),
        );
      });
    });

    it('calls editSecretResource and navigates on successful submit (source basic auth) after entering password', async () => {
      (editSecretResource as jest.Mock).mockResolvedValue(undefined);

      renderWithSecret({ secretData: mockSourceSecretBasicAuthForEdit });

      await waitFor(() => {
        expect(screen.getByTestId('secret-source-password')).toBeInTheDocument();
      });

      fireEvent.input(screen.getByTestId('secret-source-password'), {
        target: { value: 'newpassword' },
      });

      act(() => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(editSecretResource).toHaveBeenCalledWith(
          mockSourceSecretBasicAuthForEdit,
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
        );
      });

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith(
          SECRET_LIST_PATH.createPath({ workspaceName: 'test-ns' }),
        );
      });
    });

    it('shows validation error when source basic auth password is empty on submit', async () => {
      renderWithSecret({ secretData: mockSourceSecretBasicAuthForEdit });

      await waitFor(() => {
        expect(screen.getByTestId('secret-source-password')).toBeInTheDocument();
      });

      // Touch password field and leave empty to trigger validation
      const passwordInput = screen.getByTestId('secret-source-password');
      fireEvent.focus(passwordInput);
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText('Required')).toBeInTheDocument();
      });

      expect(editSecretResource).not.toHaveBeenCalled();
    });

    it('sets submit error and does not navigate when editSecretResource rejects', async () => {
      (editSecretResource as jest.Mock).mockRejectedValue(new Error('Patch failed'));

      renderWithSecret({ secretData: mockOpaqueSecretForEdit });

      await waitFor(() => {
        expect(screen.getByDisplayValue('key1')).toBeInTheDocument();
      });

      // Make form dirty so submit is enabled
      fireEvent.input(screen.getByDisplayValue('key1'), { target: { value: 'key1-x' } });
      fireEvent.blur(screen.getByDisplayValue('key1-x'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled();
      });

      act(() => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('Patch failed')).toBeInTheDocument();
      });

      expect(navigateMock).not.toHaveBeenCalledWith(
        SECRET_LIST_PATH.createPath({ workspaceName: 'test-ns' }),
      );
    });
  });
});
