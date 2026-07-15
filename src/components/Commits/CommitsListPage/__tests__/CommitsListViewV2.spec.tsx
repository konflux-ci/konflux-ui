import * as React from 'react';
import { Table, Thead, Tr, Th, Tbody } from '@patternfly/react-table';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { pipelineWithCommits } from '~/components/Commits/__data__/pipeline-with-commits';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { TEXT_SEARCH_TYPES } from '~/consts/constants';
import { PipelineRunLabel, PipelineRunType, runStatus } from '~/consts/pipelinerun';
import { useComponent } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import * as dateTime from '~/shared/components/timestamp/datetime';
import { PipelineRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import {
  mockUseSearchParamBatch,
  resetMockSearchParams,
} from '~/unit-test-utils/mock-useSearchParam';
import { getCommitsFromPLRs } from '~/utils/commits-utils';
import CommitsListRow from '../CommitsListRow';
import CommitsListViewV2 from '../CommitsListViewV2';

jest.useFakeTimers();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('~/components/Commits/commit-status.ts', () => {
  const actual = jest.requireActual('~/components/Commits/commit-status.ts');
  return {
    ...actual,
    useCommitStatus: () => [runStatus.Pending, true, undefined],
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
      props?.onRowsRendered?.({ stopIndex: Math.max(data.length - 1, 0) });
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

jest.mock('~/hooks/useScanResults', () => ({
  usePLRVulnerabilities: jest.fn(() => ({})),
}));

const useComponentMock = useComponent as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('test-ns');
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

const withBuildLabels = (plr: PipelineRunKind): PipelineRunKind => ({
  ...plr,
  metadata: {
    ...plr.metadata,
    labels: {
      ...plr.metadata.labels,
      [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
      [PipelineRunLabel.COMPONENT_VERSION]: 'main',
    },
  },
});

const buildPipelineRuns = [
  withBuildLabels(pipelineWithCommits[0]),
  withBuildLabels(pipelineWithCommits[2]),
];

const commits = getCommitsFromPLRs(buildPipelineRuns);

const mockComponentWithVersions = {
  metadata: { name: 'sample-component', creationTimestamp: '2022-01-01T00:00:00Z' },
  spec: { source: { versions: [{ name: 'v1.0', revision: 'main' }] } },
};

const CommitsListV2 = ({ versionName }: { versionName?: string }) => (
  <FilterContextProvider filterParams={['name', 'status', 'version']}>
    <CommitsListViewV2 componentName="sample-component" versionName={versionName} />
  </FilterContextProvider>
);

describe('CommitsListViewV2', () => {
  beforeEach(() => {
    resetMockSearchParams();
    jest.clearAllMocks();
    usePipelineRunsV2Mock.mockReturnValue([
      buildPipelineRuns,
      true,
      undefined,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    useComponentMock.mockReturnValue([mockComponentWithVersions, true, undefined]);
    useNamespaceMock.mockReturnValue('test-ns');
  });

  it('should render error state when there is an API error', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      new Error('500: Internal server error'),
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<CommitsListV2 />);
    screen.getByText('Unable to load commits');
  });

  it('should render error state when component loading fails', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('component error')]);
    renderWithQueryClient(<CommitsListV2 />);
    screen.getByText('Unable to load commits');
  });

  it('should render empty state if no commits are present', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      undefined,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<CommitsListV2 />);
    expect(screen.getByText('Monitor your CI/CD activity in one place')).toBeVisible();
  });

  it('renders correct commit data', () => {
    const { getByText, queryByText, container } = renderWithQueryClient(
      <CommitsListRow obj={commits[0]} status={runStatus.Pending} />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[0].creationTime));
    expect(queryByText('commit1')).toBeInTheDocument();
    expect(getByText('#11 test-title')).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getByText('branch_1')).toBeInTheDocument();
    expect(getByText('sample-component')).toBeInTheDocument();
  });

  it('should filter present in the view', async () => {
    renderWithQueryClient(<CommitsListV2 />);
    await waitFor(() => screen.getAllByText('Status'));
    await waitFor(() => screen.getAllByPlaceholderText<HTMLInputElement>('Filter by name...'));
  });

  it('should match the commit if it is filtered by name', async () => {
    const view = renderWithQueryClient(<CommitsListV2 />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, { target: { value: 'test-title' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    view.rerender(<CommitsListV2 />);

    await waitFor(() => {
      expect(screen.getByText('#11 test-title')).toBeInTheDocument();
      expect(screen.getByText('#12 test-title-3')).toBeInTheDocument();
    });
  });

  it('should match the commit if it is filtered by pull request number', async () => {
    const view = renderWithQueryClient(<CommitsListV2 />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, { target: { value: '#12' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    view.rerender(<CommitsListV2 />);

    await waitFor(() => {
      expect(screen.queryByText('#11 test-title')).not.toBeInTheDocument();
      expect(screen.getByText('#12 test-title-3')).toBeInTheDocument();
    });
  });

  it('should match the commit if it is filtered by component name', async () => {
    const view = renderWithQueryClient(<CommitsListV2 />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, { target: { value: 'governance-policy' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    view.rerender(<CommitsListV2 />);

    await waitFor(() => {
      expect(screen.queryByText('#11 test-title')).not.toBeInTheDocument();
      expect(screen.getByText('#12 test-title-3')).toBeInTheDocument();
    });
  });

  it('should filter commits by version text match on branch', () => {
    renderWithQueryClient(
      <FilterContext.Provider
        value={{
          filters: { version: 'branch_1' },
          setFilters: jest.fn(),
          onClearFilters: jest.fn(),
        }}
      >
        <CommitsListViewV2 componentName="sample-component" />
      </FilterContext.Provider>,
    );

    expect(screen.getByText('#11 test-title')).toBeInTheDocument();
    expect(screen.queryByText('#12 test-title-3')).not.toBeInTheDocument();
  });

  it('should filter commits by status', async () => {
    const view = renderWithQueryClient(<CommitsListV2 />);

    const statusFilter = screen.getByRole('button', { name: /status filter menu/i });
    fireEvent.click(statusFilter);

    const succeededOption = screen.getByLabelText(/succeeded/i, { selector: 'input' });
    fireEvent.click(succeededOption);

    view.rerender(<CommitsListV2 />);

    await waitFor(() => {
      expect(screen.getByText('#11 test-title')).toBeInTheDocument();
      expect(screen.getByText('#12 test-title-3')).toBeInTheDocument();
    });
  });

  it('should not show search type dropdown when versionName is not provided', () => {
    renderWithQueryClient(<CommitsListV2 />);
    expect(
      screen
        .queryAllByRole('button', { name: TEXT_SEARCH_TYPES.NAME })
        .find((button) => button.classList.contains('pf-v6-c-menu-toggle')),
    ).toBeUndefined();
    expect(screen.getByPlaceholderText('Filter by name...')).toBeVisible();
  });

  it('should show Name/Version search dropdown when versionName is provided', () => {
    renderWithQueryClient(<CommitsListV2 versionName="main" />);
    expect(
      screen
        .getAllByRole('button', { name: TEXT_SEARCH_TYPES.NAME })
        .find((button) => button.classList.contains('pf-v6-c-menu-toggle')),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Version filter menu' })).not.toBeInTheDocument();
  });

  it('should show loader if next page is loading', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      undefined,
      jest.fn(),
      { isFetchingNextPage: true, hasNextPage: true },
    ]);

    renderWithQueryClient(<CommitsListV2 />);

    expect(screen.getByTestId('commits-list-next-page-loading-spinner')).toBeVisible();
  });

  it('should call usePipelineRunsV2 with correct component label selector', () => {
    renderWithQueryClient(<CommitsListV2 />);

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

  it('should include version label in selector when versionName is provided', () => {
    renderWithQueryClient(<CommitsListV2 versionName="main" />);

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
      undefined,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<CommitsListV2 />);
    expect(screen.getByTestId('data-table-skeleton')).toBeVisible();
  });

  it('should auto-fetch next page when build pipeline runs are empty but more pages exist', () => {
    const getNextPage = jest.fn();
    const nonBuildRuns = buildPipelineRuns.map((plr) => ({
      ...plr,
      metadata: {
        ...plr.metadata,
        labels: {
          ...plr.metadata.labels,
          [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
        },
      },
    })) as PipelineRunKind[];

    usePipelineRunsV2Mock.mockReturnValue([
      nonBuildRuns,
      true,
      undefined,
      getNextPage,
      { isFetchingNextPage: false, hasNextPage: true },
    ]);

    renderWithQueryClient(<CommitsListV2 />);

    expect(getNextPage).toHaveBeenCalled();
  });

  it('should fetch next page when scrolling to the last row', () => {
    const getNextPage = jest.fn();
    usePipelineRunsV2Mock.mockReturnValue([
      buildPipelineRuns,
      true,
      undefined,
      getNextPage,
      { isFetchingNextPage: false, hasNextPage: true },
    ]);

    renderWithQueryClient(<CommitsListV2 />);

    expect(getNextPage).toHaveBeenCalled();
  });

  it('should sort commits by status when status column is clicked', async () => {
    const failedRun = {
      ...withBuildLabels(pipelineWithCommits[2]),
      status: {
        ...pipelineWithCommits[2].status,
        conditions: [
          {
            lastTransitionTime: '2022-06-20T12:49:27Z',
            message: 'Tasks Failed: 1',
            reason: 'Failed',
            status: 'False',
            type: 'Succeeded',
          },
        ],
      },
    } as PipelineRunKind;

    usePipelineRunsV2Mock.mockReturnValue([
      [withBuildLabels(pipelineWithCommits[0]), failedRun],
      true,
      undefined,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    renderWithQueryClient(<CommitsListV2 />);

    const table = screen.getByRole('table', { name: 'table' });
    const statusSortButton = within(table)
      .getAllByRole('button', { name: /status/i })
      .find((button) => button.classList.contains('pf-v6-c-table__button'));
    expect(statusSortButton).toBeDefined();
    fireEvent.click(statusSortButton);

    await waitFor(() => {
      expect(screen.getByText('#11 test-title')).toBeInTheDocument();
      expect(screen.getByText('#12 test-title-3')).toBeInTheDocument();
    });

    fireEvent.click(statusSortButton);

    await waitFor(() => {
      expect(screen.getByText('#11 test-title')).toBeInTheDocument();
      expect(screen.getByText('#12 test-title-3')).toBeInTheDocument();
    });
  });

  it('should show filtered empty state when no commits match filters', async () => {
    const view = renderWithQueryClient(<CommitsListV2 />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, { target: { value: 'no-match' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    view.rerender(<CommitsListV2 />);

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('should handle undefined pipeline runs from the hook', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      undefined,
      true,
      undefined,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<CommitsListV2 />);
    expect(screen.getByText('Monitor your CI/CD activity in one place')).toBeVisible();
  });

  it('should exclude non-build pipeline runs from commit list', () => {
    const mixedRuns = [
      ...buildPipelineRuns,
      {
        ...buildPipelineRuns[0],
        metadata: {
          ...buildPipelineRuns[0].metadata,
          name: 'non-build-run',
          labels: {
            ...buildPipelineRuns[0].metadata.labels,
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
          },
        },
      },
    ] as PipelineRunKind[];

    usePipelineRunsV2Mock.mockReturnValue([
      mixedRuns,
      true,
      undefined,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    renderWithQueryClient(<CommitsListV2 />);

    expect(screen.queryByText('non-build-run')).not.toBeInTheDocument();
    expect(screen.getByText('#11 test-title')).toBeInTheDocument();
    expect(screen.getByText('#12 test-title-3')).toBeInTheDocument();
  });
});
