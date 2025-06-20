import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { NamespaceKind } from '~/types';
import { mockNamespaceHooks, mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import {
  createK8sUtilMock,
  createReactRouterMock,
  renderWithQueryClientAndRouter,
} from '../../../utils/test-utils';
import { useModalLauncher } from '../../modal/ModalProvider';
import NamespaceListRow from '../NamespaceListRow';
import NamespaceListView from '../NamespaceListView';

jest.useFakeTimers();

// Mock the necessary hooks and components
jest.mock('~/hooks/useApplications', () => ({
  useApplications: jest.fn(() => [[], true]),
}));

jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

jest.mock('~/shared/components/table', () => {
  const actual = jest.requireActual('../../../shared/components/table');
  return {
    ...actual,
    Table: (props) => {
      const { data, filters, selected, match, kindObj } = props;
      const cProps = { data, filters, selected, match, kindObj };
      const columns = props.Header(cProps);
      return (
        <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
          <TableHeader role="rowgroup" />
          <tbody>
            {props.data.map((d, i) => (
              <tr key={i}>
                <NamespaceListRow columns={null} obj={d} />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

// Create mocks for K8s API calls
const mockK8sQueryListResourceItems = createK8sUtilMock('K8sQueryListResourceItems');
const mockK8sQueryCreateResource = createK8sUtilMock('K8sQueryCreateResource');
const mockK8sQueryDeleteResource = createK8sUtilMock('K8sQueryDeleteResource');

// Mock the modal launcher
const mockShowModal = jest.fn();
const mockUseModalLauncher = useModalLauncher as jest.Mock;

const mockNamespaceData = {
  namespace: 'test-namespace',
  namespaceResource: undefined,
  namespacesLoaded: true,
  namespaces: [
    {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'test-namespace',
        creationTimestamp: '2023-01-01T00:00:00Z',
      },
      spec: {},
      status: {},
    } as NamespaceKind,
  ],
  lastUsedNamespace: 'test-namespace',
};

const mockUseNamespaceInfo = mockNamespaceHooks('useNamespaceInfo', mockNamespaceData);

const renderNamespaceListView = () => {
  return renderWithQueryClientAndRouter(
    <FilterContextProvider filterParams={['name']}>
      <NamespaceListView />
    </FilterContextProvider>,
  );
};

describe('ManageVisibilityModal Integration', () => {
  createReactRouterMock('useFetcher');
  mockUseNamespaceHook('test-namespace');

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockUseNamespaceInfo.mockReturnValue(mockNamespaceData);

    // Mock the modal launcher
    mockUseModalLauncher.mockReturnValue(mockShowModal);

    // Mock the RoleBinding list API call to return empty array (private namespace)
    mockK8sQueryListResourceItems.mockResolvedValue([]);

    // Mock create/delete operations
    mockK8sQueryCreateResource.mockResolvedValue({});
    mockK8sQueryDeleteResource.mockResolvedValue({});
  });

  it('should call modal launcher each time manage visibility is clicked', async () => {
    renderNamespaceListView();

    // Wait for the namespace list to load
    await waitFor(() => {
      expect(screen.getByText('test-namespace')).toBeInTheDocument();
    });

    // Find and click the kebab menu button
    const kebabButton = screen.getByTestId('kebab-button');
    fireEvent.click(kebabButton);

    // Wait for the kebab menu to open and click "Manage visibility"
    await waitFor(() => {
      const manageVisibilityButton = screen.getByText('Manage visibility');
      fireEvent.click(manageVisibilityButton);
    });

    // Verify the modal launcher was called the first time
    expect(mockShowModal).toHaveBeenCalledTimes(1);
    expect(mockShowModal).toHaveBeenCalledWith(expect.any(Function));

    // Clear the mock call count
    mockShowModal.mockClear();

    // Open the kebab menu again
    fireEvent.click(kebabButton);
    await waitFor(() => {
      const manageVisibilityButton = screen.getByText('Manage visibility');
      fireEvent.click(manageVisibilityButton);
    });

    // Verify the modal launcher was called again (second time)
    expect(mockShowModal).toHaveBeenCalledTimes(1);
    expect(mockShowModal).toHaveBeenCalledWith(expect.any(Function));
  });
});
