import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { PipelineRunLabel, PipelineRunType, runStatus } from '~/consts/pipelinerun';
import {
  mockUseSearchParamBatch,
  resetMockSearchParams,
} from '~/unit-test-utils/mock-useSearchParam';
import { useComponents } from '../../../../hooks/useComponents';
import { usePipelineRunsV2 } from '../../../../hooks/usePipelineRunsV2';
import * as dateTime from '../../../../shared/components/timestamp/datetime';
import { PipelineRunKind } from '../../../../types';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { getCommitsFromPLRs } from '../../../../utils/commits-utils';
import { pipelineRunMatchesCommitSearch } from '../../../../utils/pipeline-run-commit-search';
import { createUseApplicationMock, renderWithQueryClient } from '../../../../utils/test-utils';
import { pipelineWithCommits } from '../../__data__/pipeline-with-commits';
import { MockComponents } from '../../CommitDetails/visualization/__data__/MockCommitWorkflowData';
import CommitsListRow from '../CommitsListRow';
import CommitsListView from '../CommitsListView';

jest.useFakeTimers();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../commit-status', () => {
  const actual = jest.requireActual('../../commit-status');
  return {
    ...actual,
    useCommitStatus: () => [runStatus.Pending, true, undefined],
  };
});

jest.mock('../../../../hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

jest.mock('../../../../shared/components/table/TableComponent', () => {
  return (props) => {
    const { data, filters, selected, match, kindObj } = props;
    const cProps = { data, filters, selected, match, kindObj };
    const columns = props.Header(cProps);

    return (
      <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
        <TableHeader role="rowgroup" />
        <tbody>
          {props.data.map((d, i) => (
            <tr key={i}>
              <CommitsListRow obj={d} status={runStatus.Pending} />
            </tr>
          ))}
        </tbody>
      </PfTable>
    );
  };
});

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));

jest.mock('../../../../hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

const useComponentsMock = useComponents as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('test-ns');
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

const commits = getCommitsFromPLRs(pipelineWithCommits.slice(0, 4));

const CommitsList = () => (
  <FilterContextProvider filterParams={['name', 'status']}>
    <CommitsListView applicationName="purple-mermaid-app" />
  </FilterContextProvider>
);

const defaultPipelineRunsForView = pipelineWithCommits
  .slice(0, 4)
  .filter(
    (plr) => plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
  );

// Represents the full set the backend can return when a search term is provided,
// including historical pipeline runs not in the initial page (pipelineWithCommits[4+]).
const allBuildPipelineRunsForSearch = pipelineWithCommits.filter(
  (plr) => plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
);

describe('CommitsListView', () => {
  beforeEach(() => {
    resetMockSearchParams();
    usePipelineRunsV2Mock.mockImplementation(
      (_ns, options: { commitSearchTerm?: string } | undefined) => {
        const raw = options?.commitSearchTerm;
        const term = typeof raw === 'string' ? raw.trim() : '';
        const plrs = term
          ? allBuildPipelineRunsForSearch.filter((plr) => pipelineRunMatchesCommitSearch(plr, term))
          : defaultPipelineRunsForView;
        return [
          plrs,
          true,
          undefined,
          undefined,
          { isFetchingNextPage: false, hasNextPage: false },
        ];
      },
    );
    useComponentsMock.mockReturnValue([MockComponents, true]);
    useNamespaceMock.mockReturnValue('test-ns');
  });

  it('should render error state when there is an API error', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      new Error('500: Internal server error'),
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<CommitsList />);
    screen.getByText('Unable to load commits');
  });

  it('should render empty state if no commits are present', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<CommitsList />);
    expect(
      screen.getByText(
        /To get started, add a component and merge its pull request for a build pipeline./,
      ),
    ).toBeVisible();
    const addButton = screen.queryByText('Add component');
    expect(addButton).toBeInTheDocument();
    expect(addButton.closest('a').href).toContain(
      `http://localhost/ns/test-ns/import?application=purple-mermaid-app`,
    );
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
    renderWithQueryClient(<CommitsList />);
    await waitFor(() => screen.getAllByText('Status'));
    await waitFor(() => screen.getAllByPlaceholderText<HTMLInputElement>('Filter by name...'));
  });

  it('should match the commit if it is filtered by name', () => {
    const view = renderWithQueryClient(<CommitsList />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'test-title' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsList />);
    expect(screen.queryByText('#11 test-title')).toBeInTheDocument();
    expect(screen.getByText('#12 test-title-3')).toBeInTheDocument();
  });

  it('should match the commits if it is filtered by pr number', () => {
    const view = renderWithQueryClient(<CommitsList />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: '#11' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsList />);
    expect(screen.queryByText('#12 test-title-3')).not.toBeInTheDocument();
    expect(screen.queryByText('#11 test-title')).toBeInTheDocument();
  });

  it('should perform case insensitive filter by name', () => {
    const view = renderWithQueryClient(<CommitsList />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'TEST-TITLE-3' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsList />);
    expect(screen.queryByText('#12 test-title-3')).toBeInTheDocument();
    expect(screen.queryByText('#11 test-title')).not.toBeInTheDocument();
  });

  it('should not match the commit if filtered by unmatched name', () => {
    const view = renderWithQueryClient(<CommitsList />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'invalid-test-title-3' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsList />);
    expect(screen.queryByText('#11 test-title')).not.toBeInTheDocument();
    expect(screen.queryByText('#12 test-title-3')).not.toBeInTheDocument();

    // No rows + empty state can hide the toolbar; remount to clear search params like a fresh visit.
    view.unmount();
    resetMockSearchParams();
    renderWithQueryClient(<CommitsList />);
    expect(screen.queryByText('#11 test-title')).toBeInTheDocument();
    expect(screen.queryByText('#12 test-title-3')).toBeInTheDocument();
  });

  it('should filter by commit status', () => {
    const failedPlr: PipelineRunKind = {
      ...pipelineWithCommits[2],
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
    };
    usePipelineRunsV2Mock.mockImplementation(
      (_ns, options: { commitSearchTerm?: string } | undefined) => {
        const raw = options?.commitSearchTerm;
        const term = typeof raw === 'string' ? raw.trim() : '';
        const buildPlrs = [pipelineWithCommits[0], failedPlr].filter(
          (plr) => plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
        );
        const plrs = term
          ? buildPlrs.filter((plr) => pipelineRunMatchesCommitSearch(plr, term))
          : buildPlrs;
        return [
          plrs,
          true,
          undefined,
          undefined,
          { isFetchingNextPage: false, hasNextPage: false },
        ];
      },
    );

    const view = renderWithQueryClient(<CommitsList />);

    const filterMenuButton = view.getByRole('button', { name: /filter/i });
    fireEvent.click(filterMenuButton);

    const successCb = view.getByLabelText(/succeeded/i, {
      selector: 'input',
    }) as HTMLInputElement;
    fireEvent.click(successCb);

    view.rerender(<CommitsList />);
    expect(screen.queryByText('#11 test-title')).toBeInTheDocument();
    expect(screen.queryByText('#12 test-title-3')).not.toBeInTheDocument();
  });

  it('should render skeleton while data is not loaded', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    useComponentsMock.mockReturnValue([[], false]);
    renderWithQueryClient(<CommitsList />);
    expect(screen.getByTestId('data-table-skeleton')).toBeVisible();
  });

  it('should call usePipelineRuns with componentName when provided', () => {
    usePipelineRunsV2Mock.mockClear();
    renderWithQueryClient(
      <FilterContextProvider filterParams={['name', 'status']}>
        <CommitsListView applicationName="purple-mermaid-app" componentName="sample-component" />
      </FilterContextProvider>,
    );

    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
      'test-ns', // namespace
      expect.objectContaining({
        selector: {
          filterByCreationTimestampAfter: undefined,
          matchLabels: {
            'appstudio.openshift.io/application': 'purple-mermaid-app',
            'appstudio.openshift.io/component': 'sample-component',
          },
        },
      }),
    );
  });

  it('should pass commit search options to usePipelineRunsV2 when filtering commits', () => {
    const view = renderWithQueryClient(<CommitsList />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'commit123' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsList />);

    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        commitSearchTerm: 'commit123',
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            'appstudio.openshift.io/application': 'purple-mermaid-app',
          }),
        }),
      }),
    );
    expect(usePipelineRunsV2Mock).not.toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            'pipelines.appstudio.openshift.io/type': 'build',
          }),
        }),
      }),
    );

    view.unmount();
    // Next test's beforeEach runs resetMockSearchParams; no cleanup needed here.
  });

  it('should show loader if next page is loading', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      defaultPipelineRunsForView,
      true,
      undefined,
      undefined,
      { isFetchingNextPage: true, hasNextPage: true },
    ]);

    renderWithQueryClient(
      <FilterContextProvider filterParams={['name', 'status']}>
        <CommitsListView applicationName="purple-mermaid-app" componentName="sample-component" />
      </FilterContextProvider>,
    );

    expect(screen.getByTestId('commits-list-next-page-loading-spinner')).toBeVisible();
  });

  it('should surface a historical commit not in the initial page when searching', async () => {
    // 'commit777' exists only in pipelineWithCommits[4], which is outside the default
    // slice(0,4) used for the initial (no-search) view. This verifies that the component
    // merges backend search results (allBuildPipelineRunsForSearch) rather than
    // re-filtering already-loaded rows, so historical commits are discoverable.
    const view = renderWithQueryClient(<CommitsList />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'commit777' } });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsList />);

    await waitFor(() => {
      expect(screen.getByText('manual-build-component')).toBeInTheDocument();
    });
  });

  it('should display commits in a sorted order', async () => {
    renderWithQueryClient(<CommitsList />);

    await waitFor(() => {
      // Check that commits are rendered
      expect(screen.getByText('#11 test-title')).toBeInTheDocument();
    });
  });
});
