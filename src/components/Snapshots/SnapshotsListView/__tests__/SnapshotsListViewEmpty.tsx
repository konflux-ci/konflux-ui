import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { NamespaceContext } from '../../../../shared/providers/Namespace/namespace-context';
import { createUseParamsMock, createTestQueryClient } from '../../../../utils/test-utils';
import SnapshotsListView from '../SnapshotsListView';

jest.useFakeTimers();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResources: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});

jest.mock('../useSnapshotsColumnManagement', () => ({
  useSnapshotsColumnManagement: () => ({
    visibleColumns: new Set([
      'name',
      'createdAt',
      'components',
      'trigger',
      'commit',
      'status',
      'kebab',
    ]),
    isColumnManagementOpen: false,
    openColumnManagement: jest.fn(),
    closeColumnManagement: jest.fn(),
    handleVisibleColumnsChange: jest.fn(),
  }),
}));

const useMockSnapshots = useK8sAndKarchResources as jest.Mock;

const createWrappedComponent = (client?: QueryClient) => {
  const queryClient = client ?? createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NamespaceContext.Provider
          value={{
            namespace: 'test-namespace',
            lastUsedNamespace: 'test-namespace',
            namespaceResource: undefined,
            namespaces: [],
            namespacesLoaded: true,
          }}
        >
          <FilterContextProvider filterParams={['name']}>
            <SnapshotsListView applicationName="test-app" />
          </FilterContextProvider>
        </NamespaceContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SnapshotsListView - Empty State', () => {
  createUseParamsMock({ applicationName: 'test-app' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display empty state when no snapshots are found', () => {
    // Mock empty snapshots data
    useMockSnapshots.mockReturnValue({
      data: [],
      isLoading: false,
      hasError: false,
    });

    render(createWrappedComponent());

    // Check for the empty state title
    expect(screen.getByText('No snapshots found')).toBeInTheDocument();

    // Check for the empty state description text
    expect(
      screen.getByText(/Snapshots are created automatically by push events or pull request events/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Snapshots can also created by created by manually if needed/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Once created, Snapshots will be displayed on this page/),
    ).toBeInTheDocument();

    // Check for the empty state test attribute
    expect(screen.getByTestId('snapshots-empty-state')).toBeInTheDocument();
  });

  it('should display empty state when snapshots data is undefined', () => {
    // Mock undefined snapshots data
    useMockSnapshots.mockReturnValue({
      data: undefined,
      isLoading: false,
      hasError: false,
    });

    render(createWrappedComponent());

    // Check for the empty state title
    expect(screen.getByText('No snapshots found')).toBeInTheDocument();

    // Check for the empty state description text
    expect(
      screen.getByText(/Snapshots are created automatically by push events or pull request events/),
    ).toBeInTheDocument();
  });

  it('should display empty state when snapshots data is null', () => {
    // Mock null snapshots data
    useMockSnapshots.mockReturnValue({
      data: null,
      isLoading: false,
      hasError: false,
    });

    render(createWrappedComponent());

    // Check for the empty state title
    expect(screen.getByText('No snapshots found')).toBeInTheDocument();

    // Check for the empty state description text
    expect(
      screen.getByText(/Snapshots are created automatically by push events or pull request events/),
    ).toBeInTheDocument();
  });

  it('should not display empty state when snapshots are loading', () => {
    // Mock loading state
    useMockSnapshots.mockReturnValue({
      data: [],
      isLoading: true,
      hasError: false,
    });

    render(createWrappedComponent());

    // Should show loading spinner, not empty state
    expect(screen.queryByText('No snapshots found')).not.toBeInTheDocument();
    expect(screen.queryByTestId('snapshots-empty-state')).not.toBeInTheDocument();
  });

  it('should not display empty state when there is an error', () => {
    // Mock error state
    useMockSnapshots.mockReturnValue({
      data: [],
      isLoading: false,
      hasError: true,
    });

    render(createWrappedComponent());

    // Should show error state, not empty state
    expect(screen.queryByText('No snapshots found')).not.toBeInTheDocument();
    expect(screen.queryByTestId('snapshots-empty-state')).not.toBeInTheDocument();
  });
});
