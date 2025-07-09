import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { NamespaceContext } from '../../../../shared/providers/Namespace/namespace-context';
import { Snapshot } from '../../../../types/coreBuildService';
import { createUseParamsMock, createTestQueryClient } from '../../../../utils/test-utils';
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

jest.mock('../useSnapshotsColumnManagement', () => ({
  useSnapshotsColumnManagement: () => ({
    visibleColumns: new Set([
      'name',
      'createdAt',
      'components',
      'trigger',
      'commit',
      'latestRelease',
      'kebab',
    ]),
    isColumnManagementOpen: false,
    openColumnManagement: jest.fn(),
    closeColumnManagement: jest.fn(),
    handleVisibleColumnsChange: jest.fn(),
  }),
}));

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

// Mock snapshot data
const mockSnapshots: Snapshot[] = [
  {
    kind: 'Snapshot',
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    metadata: {
      name: 'my-app-snapshot-1',
      namespace: 'test-namespace',
      creationTimestamp: '2023-01-01T10:00:00Z',
      uid: 'snapshot-1-uid',
      labels: {
        'appstudio.openshift.io/application': 'test-app',
        'appstudio.openshift.io/component': 'frontend-component',
      },
    },
    spec: {
      application: 'test-app',
      displayName: 'Frontend Snapshot 1',
      components: [
        {
          containerImage: 'quay.io/test/frontend:v1.0.0',
          name: 'frontend-component',
          source: {
            git: {
              url: 'https://github.com/test/frontend',
              revision: 'main',
            },
          },
        },
        {
          containerImage: 'quay.io/test/backend:v1.0.0',
          name: 'backend-component',
          source: {
            git: {
              url: 'https://github.com/test/backend',
              revision: 'main',
            },
          },
        },
      ],
    },
  },
];

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
