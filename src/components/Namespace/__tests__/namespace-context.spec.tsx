import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { createReactRouterMock } from '../../../utils/test-utils';
import { NamespaceProvider, NamespaceContext } from '../namespace-context';

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('./utils', () => ({
  getLastUsedNamespace: jest.fn(),
  setLastUsedNamespace: jest.fn(),
  createNamespaceQueryOptions: jest.fn(),
}));

const TestConsumer = () => {
  const context = React.useContext(NamespaceContext);
  return (
    <div>
      <span data-testid="namespace">{context.namespace}</span>
      <span data-testid="loaded">{context.namespacesLoaded.toString()}</span>
      <span data-testid="last-used">{context.lastUsedNamespace}</span>
    </div>
  );
};

const useNavigateMock = createReactRouterMock('useNavigate');
const useParamsMock = createReactRouterMock('useParams');

describe('NamespaceProvider', () => {
  const mockNavigate = jest.fn();
  const mockSetLastUsedNamespace = jest.requireMock('./utils').setLastUsedNamespace;

  beforeEach(() => {
    useNavigateMock.mockReturnValue(mockNavigate);
    useParamsMock.mockReturnValue({});
  });

  it('should show loading spinner while loading', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: [], isLoading: true }) // namespaces query
      .mockReturnValueOnce({ data: null, isLoading: true }); // namespaceResource query

    render(
      <NamespaceProvider>
        <TestConsumer />
      </NamespaceProvider>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should provide namespace context when loaded', async () => {
    const mockNamespaces = [{ metadata: { name: 'default-ns' } }];
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: mockNamespaces, isLoading: false })
      .mockReturnValueOnce({ data: mockNamespaces[0], isLoading: false });

    render(
      <NamespaceProvider>
        <TestConsumer />
      </NamespaceProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('namespace')).toHaveTextContent('default-ns');
      expect(screen.getByTestId('loaded')).toHaveTextContent('true');
    });
  });

  it('should handle error state', async () => {
    const error = new Error('Namespace error');
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: [], isLoading: false })
      .mockReturnValueOnce({ error, isLoading: false });

    render(
      <NamespaceProvider>
        <TestConsumer />
      </NamespaceProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to access namespace')).toBeInTheDocument();
      expect(screen.getByText('Namespace error')).toBeInTheDocument();
    });
  });

  it('should navigate to home namespace on error button click', async () => {
    const mockNamespaces = [{ metadata: { name: 'home-ns' } }];
    const error = new Error('Namespace error');
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: mockNamespaces, isLoading: false })
      .mockReturnValueOnce({ error, isLoading: false });

    render(
      <NamespaceProvider>
        <TestConsumer />
      </NamespaceProvider>,
    );

    await waitFor(() => {
      screen.getByRole('button', { name: /Go to home-ns namespace/i }).click();
      expect(mockSetLastUsedNamespace).toHaveBeenCalledWith('home-ns');
      expect(mockNavigate).toHaveBeenCalledWith('/namespaces/home-ns/applications');
    });
  });
});
