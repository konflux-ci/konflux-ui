import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { useBuildPipelines } from '../../../../hooks/useBuildPipelines';
import { useComponents } from '../../../../hooks/useComponents';
import { useTRPipelineRuns } from '../../../../hooks/useTektonResults';
import * as dateTime from '../../../../shared/components/timestamp/datetime';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { getCommitsFromPLRs } from '../../../../utils/commits-utils';
import { createUseApplicationMock } from '../../../../utils/test-utils';
import { pipelineWithCommits } from '../../__data__/pipeline-with-commits';
import { MockComponents } from '../../CommitDetails/visualization/__data__/MockCommitWorkflowData';
import CommitsListRow from '../CommitsListRow';
import CommitsListView from '../CommitsListView';

jest.mock('../../../../hooks/useTektonResults');
jest.useFakeTimers();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../commit-status', () => ({
  useCommitStatus: () => ['-', true],
}));

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
              <CommitsListRow obj={d} />
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

jest.mock('../../../../hooks/useBuildPipelines', () => ({
  useBuildPipelines: jest.fn(),
}));

const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;
const useComponentsMock = useComponents as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('test-ns');
const useBuildPipelinesMock = useBuildPipelines as jest.Mock;

const commits = getCommitsFromPLRs(pipelineWithCommits.slice(0, 4));

const CommitsList = () => (
  <FilterContextProvider filterParams={['name', 'status']}>
    <CommitsListView applicationName="purple-mermaid-app" />
  </FilterContextProvider>
);

describe('CommitsListView', () => {
  beforeEach(() => {
    useBuildPipelinesMock.mockReturnValue([
      pipelineWithCommits.slice(0, 4),
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    useComponentsMock.mockReturnValue([MockComponents, true]);
    useNamespaceMock.mockReturnValue('test-ns');
  });

  it('should render error state when there is an API error', () => {
    useBuildPipelinesMock.mockReturnValue([
      [],
      true,
      new Error('500: Internal server error'),
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<CommitsList />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render empty state if no commits are present', () => {
    useBuildPipelinesMock.mockReturnValue([
      [],
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<CommitsList />);
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
    const { getByText, queryByText, container } = render(
      <CommitsListRow obj={commits[0]} />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[0].creationTime));
    expect(queryByText('commit1')).toBeInTheDocument();
    expect(getByText('#11 test-title')).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getByText('branch_1')).toBeInTheDocument();
    expect(getByText('sample-component')).toBeInTheDocument();
  });

  it('should filter present in the view', async () => {
    render(<CommitsList />);
    await waitFor(() => screen.getAllByText('Status'));
    await waitFor(() => screen.getAllByPlaceholderText<HTMLInputElement>('Filter by name...'));
  });

  it('should match the commit if it is filtered by name', () => {
    const view = render(<CommitsList />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'test-title-2' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsList />);
    expect(screen.getByText('#11 test-title-2')).toBeInTheDocument();
    expect(screen.queryByText('#11 test-title')).not.toBeInTheDocument();
  });

  it('should match the commits if it is filtered by pr number', () => {
    const view = render(<CommitsList />);

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
    expect(screen.queryByText('#11 test-title-2')).toBeInTheDocument();
    expect(screen.queryByText('#11 test-title')).toBeInTheDocument();
  });

  it('should perform case insensitive filter by name', () => {
    const view = render(<CommitsList />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'TEST-TITLE-2' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsList />);
    expect(screen.queryByText('#11 test-title-2')).toBeInTheDocument();
    expect(screen.queryByText('#11 test-title')).not.toBeInTheDocument();
  });

  it('should not match the commit if filtered by unmatched name', () => {
    const view = render(<CommitsList />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'invalid-test-title-2' },
      });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<CommitsList />);
    expect(screen.queryByText('#11 test-title')).not.toBeInTheDocument();
    expect(screen.queryByText('#11 test-title-2')).not.toBeInTheDocument();

    // clear the filter
    const clearFilterButton = view.getAllByRole('button', { name: 'Clear all filters' })[0];
    fireEvent.click(clearFilterButton);
    view.rerender(<CommitsList />);
    expect(screen.queryByText('#11 test-title')).toBeInTheDocument();
    expect(screen.queryByText('#11 test-title-2')).toBeInTheDocument();
  });

  it('should filter by commit status', () => {
    const view = render(<CommitsList />);

    const filterMenuButton = view.getByRole('button', { name: /filter/i });
    fireEvent.click(filterMenuButton);

    const successCb = view.getByLabelText(/succeeded/i, {
      selector: 'input',
    }) as HTMLInputElement;
    fireEvent.click(successCb);

    view.rerender(<CommitsList />);
    expect(screen.queryByText('#11 test-title')).toBeInTheDocument();
    expect(screen.queryByText('#11 test-title-2')).not.toBeInTheDocument();
  });

  it('should render skeleton while data is not loaded', () => {
    useBuildPipelinesMock.mockReturnValue([
      [],
      false,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    useTRPipelineRunsMock.mockReturnValue([[], false]);
    useComponentsMock.mockReturnValue([[], false]);
    render(<CommitsList />);
    expect(screen.getByTestId('data-table-skeleton')).toBeVisible();
  });

  it('should call useBuildPipelines with componentName when provided', () => {
    render(
      <FilterContextProvider filterParams={['name', 'status']}>
        <CommitsListView applicationName="purple-mermaid-app" componentName="sample-component" />
      </FilterContextProvider>,
    );

    expect(useBuildPipelinesMock).toHaveBeenCalledWith(
      'test-ns', // namespace
      'purple-mermaid-app', // applicationName
      undefined, // commit
      true, // includeComponents
      ['sample-component'], // componentNames
    );
  });
});
