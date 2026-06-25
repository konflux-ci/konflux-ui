import * as React from 'react';
import { Table, Thead, Tr, Th, Tbody } from '@patternfly/react-table';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { TEXT_SEARCH_TYPES } from '~/consts/constants';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { useComponent } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import {
  mockUseSearchParamBatch,
  resetMockSearchParams,
} from '~/unit-test-utils/mock-useSearchParam';
import PipelineRunsListViewV2 from '../PipelineRunsListViewV2';

jest.useFakeTimers();
const useNamespaceMock = mockUseNamespaceHook('test-ns');

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: jest.fn(),
    useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
  };
});

jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

jest.mock('~/shared/components/table/TableComponent', () => {
  return (props) => {
    const { data, filters, selected, match, kindObj } = props;
    const cProps = { data, filters, selected, match, kindObj };
    const columns = props.Header(cProps);
    const Row = props.Row;

    React.useEffect(() => {
      props?.onRowsRendered?.({ stopIndex: data.length - 1 });
      props?.infiniteLoaderProps?.loadMoreRows?.();
      props?.infiniteLoaderProps?.isRowLoaded?.({ index: 0 });
      props?.infiniteLoaderProps?.isRowLoaded?.({ index: data.length });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    return (
      <Table role="table" aria-label="table" variant="compact" borders={true}>
        <Thead>
          <Tr>
            {columns.map((col, idx) => (
              <Th key={idx} {...(col.props ?? {})}>
                {col.title}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {props.data.map((d, i) => (
            <Tr key={props.getRowProps?.(d)?.id ?? i}>
              <Row obj={d} index={i} columns={columns} />
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };
});

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

jest.mock('~/hooks/useSnapshots', () => ({
  useSnapshot: jest.fn(() => [{ metadata: { name: 'snap' } }, false, null]),
}));

jest.mock('~/hooks/useScanResults', () => ({
  useKarchScanResults: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
  usePLRVulnerabilities: jest.fn(() => ({ vulnerabilities: {}, fetchedPipelineRuns: [] })),
}));

const useComponentMock = useComponent as jest.Mock;
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

const pipelineRuns: PipelineRunKind[] = [
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      creationTimestamp: '2022-08-04T16:23:43Z',
      finalizers: Array['chains.tekton.dev/pipelinerun'],
      name: 'basic-node-js-first',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868251',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658df1',
      labels: {
        'appstudio.openshift.io/component': 'sample-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST as string,
        [PipelineRunLabel.COMPONENT_VERSION]: 'main',
      },
      annotations: {
        [PipelineRunLabel.COMMIT_PROVIDER_LABEL]: 'github',
      },
    },
    spec: {
      key: 'key1',
    },
    status: {
      startTime: '2022-08-05T16:23:43Z',
      conditions: [
        {
          status: 'True',
          type: 'Succeeded',
        },
      ],
    } as PipelineRunStatus,
  },
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      creationTimestamp: '2022-08-04T16:23:43Z',
      finalizers: Array['chains.tekton.dev/pipelinerun'],
      name: 'basic-node-js-second',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868252',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658dfb',
      labels: {
        'appstudio.openshift.io/component': 'sample-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD as string,
        [PipelineRunLabel.COMPONENT_VERSION]: 'release-2.0',
      },
      annotations: {
        [PipelineRunLabel.COMMIT_PROVIDER_LABEL]: 'github',
      },
    },
    spec: {
      key: 'key2',
    },
    status: {} as PipelineRunStatus,
  },
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      creationTimestamp: '2022-08-03T16:23:43Z',
      name: 'basic-node-js-third',
      namespace: 'test',
      labels: {
        'appstudio.openshift.io/component': 'sample-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD as string,
        [PipelineRunLabel.COMPONENT_VERSION]: 'main',
      },
    },
    spec: {},
    status: {} as PipelineRunStatus,
  },
];

const mockComponentData = {
  metadata: {
    name: 'sample-component',
    creationTimestamp: '2022-01-01T00:00:00Z',
  },
  spec: {
    source: {
      versions: [
        { name: 'v1.0', revision: 'main' },
        { name: 'v2.0', revision: 'release-2.0' },
      ],
    },
  },
};

const TestedComponentV2 = ({ versionName }: { versionName?: string }) => (
  <FilterContextProvider filterParams={['name', 'status', 'type', 'version']}>
    <PipelineRunsListViewV2 componentName="sample-component" versionName={versionName} />
  </FilterContextProvider>
);

describe('PipelineRunsListViewV2', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    resetMockSearchParams();
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue('test-ns');
    useComponentMock.mockReturnValue([mockComponentData, true, undefined]);
    usePipelineRunsV2Mock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
  });

  it('should render error state when there is an API error', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      new Error('500: Internal server error'),
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponentV2 />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render error state when component loading fails', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('component error')]);
    renderWithQueryClient(<TestedComponentV2 />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render empty state if no pipeline runs are present', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponentV2 />);
    expect(screen.getByText('Keep tabs on components and activity')).toBeVisible();
  });

  it('should render pipeline run rows when data is available', async () => {
    renderWithQueryClient(<TestedComponentV2 />);
    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).toBeInTheDocument();
    });
  });

  it('should handle undefined pipeline runs from the hook', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      undefined,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponentV2 />);
    expect(screen.getByText('Keep tabs on components and activity')).toBeVisible();
  });

  it('should not show search type dropdown when versionName is not provided', () => {
    renderWithQueryClient(<TestedComponentV2 />);
    expect(
      screen
        .queryAllByRole('button', { name: TEXT_SEARCH_TYPES.NAME })
        .find((button) => button.classList.contains('pf-v5-c-menu-toggle')),
    ).toBeUndefined();
    expect(screen.getByPlaceholderText('Filter by name...')).toBeVisible();
  });

  it('should show Name/Version search dropdown when versionName is provided', () => {
    renderWithQueryClient(<TestedComponentV2 versionName="main" />);
    expect(
      screen
        .getAllByRole('button', { name: TEXT_SEARCH_TYPES.NAME })
        .find((button) => button.classList.contains('pf-v5-c-menu-toggle')),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Version filter menu' })).not.toBeInTheDocument();
  });

  it('should show loading spinner when fetching next page', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: true, hasNextPage: true },
    ]);
    renderWithQueryClient(<TestedComponentV2 />);
    expect(screen.getByLabelText('Loading more pipeline runs')).toBeInTheDocument();
  });

  it('should call usePipelineRunsV2 with correct selector including component label', () => {
    renderWithQueryClient(<TestedComponentV2 />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            'appstudio.openshift.io/component': 'sample-component',
          }),
        }),
      }),
    );
  });

  it('should include component version label in selector when versionName is provided', () => {
    renderWithQueryClient(<TestedComponentV2 versionName="main" />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            [PipelineRunLabel.COMPONENT_VERSION]: 'main',
          }),
        }),
      }),
    );
  });

  it('should render skeleton while data is not loaded', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponentV2 />);
    screen.getByTestId('data-table-skeleton');
  });

  it('should apply version text filter when version filter is set', async () => {
    renderWithQueryClient(
      <FilterContext.Provider
        value={{
          filters: { version: 'main' },
          setFilters: jest.fn(),
          onClearFilters: jest.fn(),
        }}
      >
        <PipelineRunsListViewV2 componentName="sample-component" />
      </FilterContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).not.toBeInTheDocument();
    });
  });

  it('should filter pipeline runs by status', async () => {
    const view = renderWithQueryClient(<TestedComponentV2 />);

    const statusFilter = screen.getByRole('button', { name: /status filter menu/i });
    fireEvent.click(statusFilter);

    const succeededOption = screen.getByLabelText(/succeeded/i, { selector: 'input' });
    fireEvent.click(succeededOption);

    view.rerender(<TestedComponentV2 />);

    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).not.toBeInTheDocument();
    });
  });

  it('should filter pipeline runs by type', async () => {
    const view = renderWithQueryClient(<TestedComponentV2 />);

    const typeFilter = screen.getByRole('button', { name: /type filter menu/i });
    fireEvent.click(typeFilter);

    const buildOption = screen.getByLabelText(/build/i, { selector: 'input' });
    fireEvent.click(buildOption);

    view.rerender(<TestedComponentV2 />);

    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-second')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-first')).not.toBeInTheDocument();
    });
  });

  it('should show filtered empty state when no results match filters', async () => {
    const view = renderWithQueryClient(<TestedComponentV2 />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, { target: { value: 'no-match' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    view.rerender(<TestedComponentV2 />);

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('should load next page when infinite loader requests more rows', () => {
    const getNextPage = jest.fn();
    usePipelineRunsV2Mock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      getNextPage,
      { isFetchingNextPage: false, hasNextPage: true },
    ]);

    renderWithQueryClient(<TestedComponentV2 />);

    expect(getNextPage).toHaveBeenCalled();
  });

  it('should not load next page when hasNextPage is false', () => {
    const getNextPage = jest.fn();
    usePipelineRunsV2Mock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      getNextPage,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    renderWithQueryClient(<TestedComponentV2 />);

    expect(getNextPage).not.toHaveBeenCalled();
  });

  it('should filter by version using search dropdown on fixed-version pages', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const view = renderWithQueryClient(<TestedComponentV2 versionName="main" />);

    const nameSearchToggle = screen
      .getAllByRole('button', { name: TEXT_SEARCH_TYPES.NAME })
      .find((button) => button.classList.contains('pf-v5-c-menu-toggle'));
    expect(nameSearchToggle).toBeDefined();
    await user.click(nameSearchToggle);
    await user.click(screen.getByRole('menuitem', { name: TEXT_SEARCH_TYPES.VERSION }));

    const versionInput = screen.getByPlaceholderText<HTMLInputElement>('Filter by version...');
    await user.type(versionInput, 'release');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    view.rerender(<TestedComponentV2 versionName="main" />);

    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-second')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-first')).not.toBeInTheDocument();
    });
  });
});
