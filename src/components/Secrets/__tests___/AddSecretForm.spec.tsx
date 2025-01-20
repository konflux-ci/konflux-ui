import { useNavigate } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor, configure } from '@testing-library/react';
import { useApplications } from '../../../hooks/useApplications';
import AddSecretForm from '../SecretsForm/AddSecretForm';

configure({ testIdAttribute: 'data-test' });

jest.mock('../../../hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../utils/secret-utils', () => {
  const actual = jest.requireActual('../utils/secret-utils');
  return {
    ...actual,
    getAddSecretBreadcrumbs: jest.fn(undefined),
  };
});

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

jest.mock('../../Workspace/useWorkspaceInfo', () => ({
  useWorkspaceInfo: jest.fn(() => ({ namespace: 'test-ns', workspace: 'test-ws' })),
}));

const useApplicationsMock = useApplications as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
window.ResizeObserver = MockResizeObserver;

describe('AddSecretForm', () => {
  let navigateMock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useApplicationsMock.mockReturnValue([[], true]);
  });

  it('should render the add secret form', async () => {
    useApplicationsMock.mockReturnValue([[], false]);

    render(<AddSecretForm />);

    await waitFor(() => {
      screen.getByText('Secret type');
      screen.getByText('Select or enter secret name');
      screen.getByText('Labels');
    });
  });

  it('should render the add secret form', async () => {
    useApplicationsMock.mockReturnValue([[], false]);

    render(<AddSecretForm />);

    fireEvent.click(screen.getByLabelText('Select or enter secret name'));
    fireEvent.blur(screen.getByLabelText('Select or enter secret name'));

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      screen.getByText('Required');
    });
  });

  it('should show source secret types', async () => {
    useApplicationsMock.mockReturnValue([[], false]);

    render(<AddSecretForm />);
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-toggle')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('dropdown-toggle'));
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

    fireEvent.click(screen.getByTestId('dropdown-toggle'));

    await waitFor(() => {
      expect(screen.getByText('Source secret')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Source secret'));

    await waitFor(() => {
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });

  it('should validate and show message for username not entered', async () => {
    useApplicationsMock.mockReturnValue([[], false]);

    render(<AddSecretForm />);
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-toggle')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('dropdown-toggle'));
    fireEvent.click(screen.getByText('Source secret'));
    fireEvent.input(screen.getByTestId('secret-source-username'), { target: { value: '' } });
    fireEvent.blur(screen.getByTestId('secret-source-username'));

    await waitFor(() => {
      screen.getByText('Required');
    });
  });

  it('should navigate back when cancel button is clicked', async () => {
    useApplicationsMock.mockReturnValue([[], false]);
    render(<AddSecretForm />);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    await waitFor(() => {
      expect(useNavigateMock).toHaveBeenCalled();
    });
  });
});
