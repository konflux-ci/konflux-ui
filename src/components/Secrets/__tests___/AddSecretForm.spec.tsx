import { useNavigate } from 'react-router-dom';
import { render, screen, waitFor, configure } from '@testing-library/react';
import { userEvent, type UserEvent } from '@testing-library/user-event';
import { useApplications } from '~/hooks/useApplications';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import AddSecretForm from '../SecretsForm/AddSecretForm';

configure({ testIdAttribute: 'data-test' });

jest.mock('~/hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('~/utils/secrets/secret-utils', () => {
  const actual = jest.requireActual('~/utils/secrets/secret-utils');
  return {
    ...actual,
    getSecretBreadcrumbs: jest.fn(() => []),
  };
});

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const useApplicationsMock = useApplications as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
window.ResizeObserver = MockResizeObserver;

describe('AddSecretForm', () => {
  let navigateMock: jest.Mock;
  let user: UserEvent;
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    user = userEvent.setup();
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useApplicationsMock.mockReturnValue([[], true]);
  });

  it('should render the add secret form', async () => {
    useApplicationsMock.mockReturnValue([[], false]);

    render(<AddSecretForm />);

    await waitFor(() => {
      expect(screen.getByText('Secret type')).toBeInTheDocument();
      expect(screen.getByText('Select or enter secret name')).toBeInTheDocument();
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });
  });

  it('should render the add secret form', async () => {
    useApplicationsMock.mockReturnValue([[], false]);

    render(<AddSecretForm />);

    const secretNameInput = screen.getByLabelText('Select or enter secret name');
    await user.click(secretNameInput);
    await user.tab();
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Required')).toBeInTheDocument();
    });
  });

  it('should show source secret types', async () => {
    useApplicationsMock.mockReturnValue([[], false]);

    render(<AddSecretForm />);
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-toggle')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('dropdown-toggle'));
    await waitFor(() => {
      expect(screen.getByText('Image pull secret')).toBeInTheDocument();
      expect(screen.getByText('Source secret')).toBeInTheDocument();
    });
  });

  it('should show source secret fields', async () => {
    useApplicationsMock.mockReturnValue([[], false]);

    render(<AddSecretForm />);
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-toggle')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('dropdown-toggle'));

    await waitFor(() => {
      expect(screen.getByText('Source secret')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Source secret'));

    await waitFor(() => {
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });

  it('should validate and show message for password not entered', async () => {
    useApplicationsMock.mockReturnValue([[], false]);

    render(<AddSecretForm />);
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-toggle')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('dropdown-toggle'));
    await user.click(screen.getByText('Source secret'));

    const passwordInput = await screen.findByLabelText('Password');
    await user.click(passwordInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Required')).toBeInTheDocument();
    });
  });

  it('should navigate back when cancel button is clicked', async () => {
    useApplicationsMock.mockReturnValue([[], false]);
    render(<AddSecretForm />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(useNavigateMock).toHaveBeenCalled();
    });
  });
});
