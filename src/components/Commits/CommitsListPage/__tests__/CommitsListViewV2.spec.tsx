import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { pipelineWithCommits } from '~/components/Commits/__data__/pipeline-with-commits';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { runStatus } from '~/consts/pipelinerun';
import { useComponent } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import * as dateTime from '~/shared/components/timestamp/datetime';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
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

const commits = getCommitsFromPLRs(pipelineWithCommits.slice(0, 4));

const CommitsListV2 = ({ versionName }: { versionName?: string }) => (
  <FilterContextProvider filterParams={['name', 'status', 'version']}>
    <CommitsListViewV2 componentName="sample-component" versionName={versionName} />
  </FilterContextProvider>
);

describe('CommitsListViewV2', () => {
  beforeEach(() => {
    usePipelineRunsV2Mock.mockReturnValue([
      pipelineWithCommits.slice(0, 4),
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    useComponentMock.mockReturnValue([
      {
        metadata: { name: 'sample-component', creationTimestamp: '2022-01-01T00:00:00Z' },
        spec: { source: { versions: [] } },
      },
      true,
      undefined,
    ]);
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
    renderWithQueryClient(<CommitsListV2 />);
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
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const view = renderWithQueryClient(<CommitsListV2 />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    await user.type(filter, 'test-title');
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsListV2 />);
    expect(screen.queryByText('#11 test-title')).toBeInTheDocument();
    expect(screen.getByText('#12 test-title-3')).toBeInTheDocument();
  });

  it('should show Name/Version search mode dropdown when versionName is provided', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithQueryClient(<CommitsListV2 versionName="main" />);

    const searchModeToggle = screen
      .getAllByRole('button', { name: 'Name' })
      .find((el) => el.classList.contains('pf-v5-c-menu-toggle'));
    if (!searchModeToggle) {
      throw new Error('Expected Name/Version search mode menu toggle');
    }

    await user.click(searchModeToggle);
    expect(screen.getByRole('menuitem', { name: 'Version' })).toBeInTheDocument();
  });

  it('should hide Name/Version search mode dropdown when versionName is not provided', () => {
    renderWithQueryClient(<CommitsListV2 />);
    const searchModeMenuToggle = screen
      .queryAllByRole('button', { name: 'Name' })
      .find((el) => el.classList.contains('pf-v5-c-menu-toggle'));
    expect(searchModeMenuToggle).toBeUndefined();
  });

  it('should show loader if next page is loading', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      undefined,
      undefined,
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

  it('should render skeleton while data is not loaded', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    useComponentMock.mockReturnValue([
      {
        metadata: { name: 'sample-component', creationTimestamp: '2022-01-01T00:00:00Z' },
        spec: { source: { versions: [] } },
      },
      true,
      undefined,
    ]);
    renderWithQueryClient(<CommitsListV2 />);
    expect(screen.getByTestId('data-table-skeleton')).toBeVisible();
  });
});
