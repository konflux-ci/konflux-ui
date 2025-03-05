import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { screen, fireEvent, waitFor, render } from '@testing-library/react';
import { NamespaceKind } from '~/types';
import { mockNamespaceHooks, mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { useSearchParam } from '../../../hooks/useSearchParam';
import {
  createReactRouterMock,
  renderWithQueryClient,
  renderWithQueryClientAndRouter,
} from '../../../utils/test-utils';
import NamespaceListRow from '../NamespaceListRow';
import NamespaceListView from '../NamespaceListView';

jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParam: jest.fn(),
}));

jest.mock('~/hooks/useApplications', () => ({
  useApplications: jest.fn(() => [[], true]),
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

const mockNamespaceData = {
  namespace: '',
  namespaceResource: undefined,
  namespacesLoaded: false,
  namespaces: [],
  lastUsedNamespace: '',
};

const mockUseNamespaceInfo = mockNamespaceHooks('useNamespaceInfo', mockNamespaceData);

describe('NamespaceListView', () => {
  createReactRouterMock('useFetcher');
  mockUseNamespaceHook('test-namespace');
  const mockSetSearchParam = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParam as jest.Mock).mockImplementation(() => ['', mockSetSearchParam]);
  });

  it('should render a spinner while loading namespaces', () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: [],
      namespacesLoaded: false,
    });

    renderWithQueryClient(<NamespaceListView />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display an empty state when no namespaces are found', () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: [],
      namespacesLoaded: true,
    });

    render(<NamespaceListView />);

    expect(screen.getByText('No namespaces found')).toBeInTheDocument();
    expect(screen.getByText('Go to create namespace instructions')).toBeInTheDocument();
  });

  it('should display the namespace table when namespaces are available', () => {
    const mockNamespaces = [
      { metadata: { name: 'namespace-1', creationTimestamp: '2023-12-01T00:00:00Z' } },
      { metadata: { name: 'namespace-2', creationTimestamp: '2023-11-01T00:00:00Z' } },
    ] as NamespaceKind[];

    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });

    renderWithQueryClientAndRouter(<NamespaceListView />);

    expect(screen.getByText('Namespaces')).toBeInTheDocument();
    expect(screen.getByText('namespace-1')).toBeInTheDocument();
    expect(screen.getByText('namespace-2')).toBeInTheDocument();
  });

  it('should filter namespaces based on input text', async () => {
    const mockNamespaces = [
      { metadata: { name: 'namespace-1' } },
      { metadata: { name: 'namespace-2' } },
    ] as NamespaceKind[];

    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });

    (useSearchParam as jest.Mock).mockImplementation(() => ['', mockSetSearchParam]);

    renderWithQueryClientAndRouter(<NamespaceListView />);

    const filterInput = screen.getByPlaceholderText('Filter by name...');
    fireEvent.change(filterInput, { target: { value: 'namespace-1' } });

    await waitFor(() => {
      expect(mockSetSearchParam).toHaveBeenCalledWith('namespace-1');
    });
    expect(screen.getByText('namespace-1')).toBeInTheDocument();
  });

  it('should clear the filter when clear button is clicked', async () => {
    const mockNamespaces = [
      { metadata: { name: 'namespace-1' } },
      { metadata: { name: 'namespace-2' } },
    ] as NamespaceKind[];

    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });

    (useSearchParam as jest.Mock).mockImplementation(() => ['namespace-1-2', mockSetSearchParam]);

    renderWithQueryClientAndRouter(<NamespaceListView />);

    expect(screen.getByPlaceholderText('Filter by name...')).toHaveValue('namespace-1-2');

    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));

    await waitFor(() => {
      expect(mockSetSearchParam).toHaveBeenCalledWith('');
    });
  });

  it('should display the filtered empty state when no results match the filter', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: [{ metadata: { name: 'namespace-1' } }] as NamespaceKind[],
      namespacesLoaded: true,
    });

    (useSearchParam as jest.Mock).mockImplementation(() => [
      'non-matching-namespace',
      mockSetSearchParam,
    ]);

    renderWithQueryClient(<NamespaceListView />);

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });
});
