import * as React from 'react';
import { Table, Tbody, Tr } from '@patternfly/react-table';
import { screen, waitFor } from '@testing-library/react';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { MINTMAKER_NAMESPACE } from '~/consts/constants';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useComponent } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { DependencyRunsListRow } from '../DependencyRunsListRow';
import { DependencyRunsListView } from '../DependencyRunsListView';

jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
}));

jest.mock('~/shared/components/table/TableComponent', () => {
  return (props) => {
    const { data, onRowsRendered } = props;
    React.useEffect(() => {
      onRowsRendered?.({ stopIndex: data.length - 1 });
    }, [data, onRowsRendered]);
    return (
      <Table role="table" aria-label={props['aria-label']}>
        <Tbody>
          {props.data.map((d: PipelineRunKind, i: number) => (
            <Tr key={i}>
              <DependencyRunsListRow obj={d} />
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };
});

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

const useComponentMock = useComponent as jest.Mock;
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

mockUseNamespaceHook('test-ns');

const mockComponentData = {
  metadata: {
    name: 'test-component',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
};

const makePipelineRun = (
  name: string,
  overrides: Partial<PipelineRunKind> = {},
): PipelineRunKind => ({
  kind: 'PipelineRun',
  apiVersion: 'tekton.dev/v1beta1',
  metadata: {
    name,
    namespace: 'test-ns',
    creationTimestamp: '2023-01-01T00:00:00Z',
    uid: `uid-${name}`,
  },
  spec: {},
  status: {
    conditions: [{ status: 'True', type: 'Succeeded' }],
    startTime: '2023-01-01T00:00:00Z',
    completionTime: '2023-01-01T00:05:00Z',
  } as PipelineRunStatus,
  ...overrides,
});

const mockRuns: PipelineRunKind[] = [
  makePipelineRun('dependency-run-alpha'),
  makePipelineRun('dependency-run-beta'),
];

const noNextPage = { isFetchingNextPage: false, hasNextPage: false };

const TestedComponent = () => (
  <FilterContextProvider filterParams={['name', 'status']}>
    <DependencyRunsListView componentName="test-component" />
  </FilterContextProvider>
);

describe('DependencyRunsListView', () => {
  beforeEach(() => {
    useComponentMock.mockReturnValue([mockComponentData, true, undefined]);
    usePipelineRunsV2Mock.mockReturnValue([mockRuns, true, null, jest.fn(), noNextPage]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders table skeleton while data is not loaded', () => {
    usePipelineRunsV2Mock.mockReturnValue([[], false, null, jest.fn(), noNextPage]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when no runs exist and no filters are active', () => {
    usePipelineRunsV2Mock.mockReturnValue([[], true, null, jest.fn(), noNextPage]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Keep tabs on components and activity')).toBeVisible();
  });

  it('renders pipeline run rows when data is available', async () => {
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => {
      expect(screen.getByText('dependency-run-alpha')).toBeInTheDocument();
      expect(screen.getByText('dependency-run-beta')).toBeInTheDocument();
    });
  });

  it('renders error state when pipeline runs error occurs', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      new Error('500: Internal server error'),
      jest.fn(),
      noNextPage,
    ]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
  });

  it('renders error state when component error occurs', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('404: Not found')]);
    usePipelineRunsV2Mock.mockReturnValue([[], false, null, jest.fn(), noNextPage]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
  });

  it('hides the filter toolbar when there are no runs and no active filters', () => {
    usePipelineRunsV2Mock.mockReturnValue([[], true, null, jest.fn(), noNextPage]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.queryByTestId('Name-input-filter')).not.toBeInTheDocument();
  });

  it('shows the filter toolbar when runs are present', async () => {
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('Name-input-filter')).toBeInTheDocument();
    });
  });

  it('does not fetch pipeline runs until the component is loaded', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClient(<TestedComponent />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(null, expect.anything());
  });

  it('does not fetch pipeline runs when component has an error', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('Not found')]);
    renderWithQueryClient(<TestedComponent />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(null, expect.anything());
  });

  it('shows a loading spinner while fetching the next page', async () => {
    usePipelineRunsV2Mock.mockReturnValue([
      mockRuns,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: true, hasNextPage: true },
    ]);
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => {
      expect(screen.getByLabelText('Loading more pipeline runs')).toBeInTheDocument();
    });
  });

  it('sorts runs by startTime descending before displaying them', async () => {
    const older = makePipelineRun('run-older', {
      status: {
        conditions: [{ status: 'True', type: 'Succeeded' }],
        startTime: '2023-01-01T00:00:00Z',
      } as PipelineRunStatus,
    });
    const newer = makePipelineRun('run-newer', {
      status: {
        conditions: [{ status: 'True', type: 'Succeeded' }],
        startTime: '2023-06-01T00:00:00Z',
      } as PipelineRunStatus,
    });
    usePipelineRunsV2Mock.mockReturnValue([[older, newer], true, null, jest.fn(), noNextPage]);
    renderWithQueryClient(<TestedComponent />);

    await waitFor(() => {
      const names = screen
        .getAllByTestId('dependency-run-name')
        .map((el) => el.textContent?.trim());
      expect(names[0]).toContain('run-newer');
      expect(names[1]).toContain('run-older');
    });
  });

  it('shows filtered empty state when active filters yield no results', () => {
    renderWithQueryClient(
      <FilterContext.Provider
        value={{
          filters: { name: 'no-match-xyz', status: [] },
          setFilters: jest.fn(),
          onClearFilters: jest.fn(),
        }}
      >
        <DependencyRunsListView componentName="test-component" />
      </FilterContext.Provider>,
    );

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('fetches pipeline runs from MINTMAKER_NAMESPACE when component is loaded', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(MINTMAKER_NAMESPACE, expect.anything());
  });

  it('passes Mintmaker component and namespace labels as matchLabels to usePipelineRunsV2', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: 'test-component',
            [PipelineRunLabel.MINTMAKER_NAMESPACE_LABEL]: 'test-ns',
          }),
        }),
      }),
    );
  });

  it('shows only runs whose name contains the active name filter', async () => {
    renderWithQueryClient(
      <FilterContext.Provider
        value={{
          filters: { name: 'alpha', status: [] },
          setFilters: jest.fn(),
          onClearFilters: jest.fn(),
        }}
      >
        <DependencyRunsListView componentName="test-component" />
      </FilterContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('dependency-run-alpha')).toBeInTheDocument();
      expect(screen.queryByText('dependency-run-beta')).not.toBeInTheDocument();
    });
  });

  it('shows the filter toolbar when a name filter is active even with no underlying runs', () => {
    usePipelineRunsV2Mock.mockReturnValue([[], true, null, jest.fn(), noNextPage]);
    renderWithQueryClient(
      <FilterContext.Provider
        value={{
          filters: { name: 'alpha', status: [] },
          setFilters: jest.fn(),
          onClearFilters: jest.fn(),
        }}
      >
        <DependencyRunsListView componentName="test-component" />
      </FilterContext.Provider>,
    );

    expect(screen.getByTestId('Name-input-filter')).toBeInTheDocument();
  });
});
