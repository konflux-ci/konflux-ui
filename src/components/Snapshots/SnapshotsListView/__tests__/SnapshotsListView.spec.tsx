import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { NamespaceContext } from '../../../../shared/providers/Namespace/namespace-context';
import { createUseParamsMock, createTestQueryClient } from '../../../../utils/test-utils';
import { mockSnapshots } from '../__data__/mock-snapshots';
import SnapshotsListRow from '../SnapshotsListRow';
import SnapshotsListView from '../SnapshotsListView';

jest.useFakeTimers();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResources: jest.fn(),
}));

jest.mock('../../../../hooks/useApplicationReleases', () => ({
  useApplicationReleases: jest.fn(() => []),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});

jest.mock('../../../../shared/components/table', () => {
  const actual = jest.requireActual('../../../../shared/components/table');
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
            {props.data.map((obj, i) => (
              <tr key={i}>
                <SnapshotsListRow obj={obj} columns={null} customData={props.customData} />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

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

describe('SnapshotsListView - Column Headers', () => {
  createUseParamsMock({ applicationName: 'test-app' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display all expected column headers correctly', () => {
    useMockSnapshots.mockReturnValue({ data: mockSnapshots, isLoading: false, hasError: false });

    act(() => {
      render(createWrappedComponent());
    });

    // Check that all required column headers are present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Created at')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Last successful release')).toBeInTheDocument();
  });
});
