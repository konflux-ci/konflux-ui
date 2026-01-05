import { useParams } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { useK8sAndKarchResource } from '~/hooks/useK8sAndKarchResources';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { useSearchParamBatch } from '~/hooks/useSearchParam';
import { renderWithQueryClient } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { createK8sWatchResourceMock } from '~/utils/test-utils';
import { PipelineRunListRow } from '../../../../PipelineRun/PipelineRunListView/PipelineRunListRow';
import { pipelineWithCommits } from '../../../__data__/pipeline-with-commits';
import { MockSnapshots } from '../../visualization/__data__/MockCommitWorkflowData';
import CommitsPipelineRunTab from '../CommitsPipelineRunTab';

jest.useFakeTimers();
const useNamespaceMock = mockUseNamespaceHook('test-ns');

jest.mock('../../../../../shared/components/table/VirtualBody', () => {
  return {
    VirtualBody: (props) => {
      return props.data.map((plr, i) => (
        <PipelineRunListRow key={i} columns={props.columns} obj={plr} />
      ));
    },
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: jest.fn(),
  useParams: jest.fn(),
  useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
}));
jest.mock('../../../../../hooks/useTektonResults', () => ({
  useTRTaskRuns: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
}));
jest.mock('../../../../../hooks/usePipelineRunsForCommitV2', () => ({
  usePipelineRunsForCommitV2: jest.fn(),
}));

jest.mock('../../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('../../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
  useComponent: jest.fn().mockReturnValue([{ metadata: { name: { test } } }, true]),
}));

jest.mock('../../../../../hooks/useSearchParam', () => ({
  useSearchParamBatch: jest.fn(),
}));

jest.mock('../../../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResource: jest.fn(),
}));

const appName = 'my-test-app';

const watchResourceMock = createK8sWatchResourceMock();
const usePipelineRunsForCommitMock = usePipelineRunsForCommitV2 as jest.Mock;
const useParamsMock = useParams as jest.Mock;
const useSearchParamBatchMock = useSearchParamBatch as jest.Mock;
const useSnapshotMock = useK8sAndKarchResource as jest.Mock;

const commitPlrs = [
  pipelineWithCommits[0],
  {
    ...pipelineWithCommits[1],
    status: {},
    metadata: {
      ...pipelineWithCommits[1].metadata,
      labels: {
        ...pipelineWithCommits[1].metadata.labels,
        [PipelineRunLabel.PIPELINE_TYPE]: 'test',
      },
    },
  },
];

const TestedComponent = () => (
  <div style={{ overflow: 'auto' }}>
    <FilterContextProvider filterParams={['name', 'status', 'type']}>
      <CommitsPipelineRunTab />
    </FilterContextProvider>
  </div>
);

describe('Commit Pipelinerun List', () => {
  mockUseNamespaceHook('test-ns');
  beforeEach(() => {
    useSearchParamBatchMock.mockImplementation(() => mockUseSearchParamBatch());
    useParamsMock.mockReturnValue({ applicationName: appName, commitName: 'test-sha-1' });
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue('test-ns');
    useSnapshotMock.mockReturnValue({
      data: MockSnapshots[0],
      isLoading: false,
      fetchError: undefined,
      wsError: undefined,
      isError: false,
    });
    // Default mock: return different values based on PipelineRunType (6th parameter)
    usePipelineRunsForCommitMock.mockImplementation(
      (_namespace, _appName, _commitName, _limit, _filterByComponents, plrType) => {
        if (plrType === PipelineRunType.TEST) {
          return [
            commitPlrs.filter(
              (plr) => plr.metadata.labels[PipelineRunLabel.PIPELINE_TYPE] === 'test',
            ),
            true,
            undefined,
            jest.fn(),
            { isFetchingNextPage: false, hasNextPage: false },
          ];
        }
        // BUILD type
        return [
          commitPlrs.filter(
            (plr) => plr.metadata.labels[PipelineRunLabel.PIPELINE_TYPE] !== 'test',
          ),
          true,
          undefined,
          jest.fn(),
          { isFetchingNextPage: false, hasNextPage: false },
        ];
      },
    );
  });
  it('should render error state if the API errors out', () => {
    usePipelineRunsForCommitMock.mockImplementation(
      (_namespace, _appName, _commitName, _limit, _filterByComponents, plrType) => {
        if (plrType === PipelineRunType.TEST) {
          return [
            [],
            true,
            new Error('500: Internal server error'),
            jest.fn(),
            { isFetchingNextPage: false, hasNextPage: false },
          ];
        }
        return [[], true, undefined, jest.fn(), { isFetchingNextPage: false, hasNextPage: false }];
      },
    );

    render(<TestedComponent />);

    screen.getByText('Unable to load pipeline runs');
  });

  it('should render empty state if no pipelinerun is present', () => {
    usePipelineRunsForCommitMock.mockImplementation(() => [
      [],
      true,
      undefined,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    watchResourceMock.mockReturnValue([[], true]);
    render(<TestedComponent />);
    screen.getByText(/Keep tabs on components and activity/);
    screen.getByText(/Monitor your components with pipelines and oversee CI\/CD activity./);
    const button = screen.getByText('Add component');
    expect(button).toBeInTheDocument();
    expect(button.closest('a').href).toContain(
      `http://localhost/ns/test-ns/import?application=my-test-app`,
    );
  });

  it('should render pipelineRuns list when pipelineRuns are present', () => {
    renderWithQueryClient(<TestedComponent />);
    screen.getByText(/Pipeline runs/);
    screen.getByText('Name');
    screen.getByText('Started');
    screen.getByText('Duration');
    screen.getAllByText('Status');
    screen.getAllByText('Type');
  });

  it('should render both Build and Test pipelineruns in the pipelinerun list', () => {
    renderWithQueryClient(<TestedComponent />);

    screen.getByText('Build');
    screen.getByText('Test');
  });

  it('should render entire pipelineRuns list when no filter value', () => {
    renderWithQueryClient(<TestedComponent />);

    expect(screen.queryByText('java-springboot-sample-x778q')).toBeInTheDocument();
    expect(screen.queryByText('nodejs-sample-zth6t')).toBeInTheDocument();
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    expect(filter.value).toBe('');
  });

  it('should render filtered pipelinerun list by name', async () => {
    const r = renderWithQueryClient(<TestedComponent />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    fireEvent.change(filter, {
      target: { value: 'springboot' },
    });
    expect(filter.value).toBe('springboot');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    r.rerender(<TestedComponent />);
    await waitFor(() => {
      expect(screen.queryByText('java-springboot-sample-x778q')).toBeInTheDocument();
      expect(screen.queryByText('nodejs-sample-zth6t')).not.toBeInTheDocument();
    });

    // clean up for other tests
    fireEvent.change(filter, {
      target: { value: '' },
    });
    expect(filter.value).toBe('');

    act(() => {
      jest.advanceTimersByTime(700);
    });
  });

  it('should render filtered pipelinerun list by status', async () => {
    const r = renderWithQueryClient(<TestedComponent />);

    const statusFilter = screen.getByRole('button', {
      name: /status filter menu/i,
    });

    fireEvent.click(statusFilter);
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');

    const succeededOption = r.getByLabelText(/succeeded/i, {
      selector: 'input',
    });

    await act(() => fireEvent.click(succeededOption));

    r.rerender(<TestedComponent />);

    await waitFor(() => {
      expect(succeededOption).toBeChecked();
    });

    await waitFor(() => {
      expect(screen.queryByText('java-springboot-sample-x778q')).toBeInTheDocument();
      expect(screen.queryByText('nodejs-sample-zth6t')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(succeededOption);
    r.rerender(<TestedComponent />);
    expect(succeededOption).not.toBeChecked();
  });

  it('should render filtered pipelinerun list by type', async () => {
    const r = renderWithQueryClient(<TestedComponent />);

    const typeFilter = screen.getByRole('button', {
      name: /type filter menu/i,
    });

    fireEvent.click(typeFilter);
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');

    const testOption = r.getByLabelText(/test/i, {
      selector: 'input',
    });

    await act(() => fireEvent.click(testOption));

    r.rerender(<TestedComponent />);

    await waitFor(() => {
      expect(testOption).toBeChecked();
    });

    await waitFor(() => {
      expect(screen.queryByText('java-springboot-sample-x778q')).not.toBeInTheDocument();
      expect(screen.queryByText('nodejs-sample-zth6t')).toBeInTheDocument();
    });

    // clean up for other tests
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(testOption);
    r.rerender(<TestedComponent />);
    expect(testOption).not.toBeChecked();
  });

  it('should clear the filters and render the list again in the table', async () => {
    const r = renderWithQueryClient(<TestedComponent />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    await act(() =>
      fireEvent.change(filter, {
        target: { value: 'no-match' },
      }),
    );

    expect(filter.value).toBe('no-match');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    r.rerender(<TestedComponent />);
    await waitFor(() => {
      expect(screen.queryByText('java-springboot-sample-x778q')).not.toBeInTheDocument();
      expect(screen.queryByText('nodejs-sample-zth6t')).not.toBeInTheDocument();
      expect(screen.queryByText('No results found')).toBeInTheDocument();
      expect(
        screen.queryByText(
          'No results match this filter criteria. Clear all filters and try again.',
        ),
      ).toBeInTheDocument();
    });

    await act(() => fireEvent.click(screen.queryByRole('button', { name: 'Clear all filters' })));
    r.rerender(<TestedComponent />);
    expect(filter.value).toBe('');

    await waitFor(() => {
      expect(screen.queryByText('java-springboot-sample-x778q')).toBeInTheDocument();
      expect(screen.queryByText('nodejs-sample-zth6t')).toBeInTheDocument();
    });
  });

  describe('Sequential fetching logic', () => {
    const getTestPlrs = () =>
      commitPlrs.filter((plr) => plr.metadata.labels[PipelineRunLabel.PIPELINE_TYPE] === 'test');
    const getBuildPlrs = () =>
      commitPlrs.filter((plr) => plr.metadata.labels[PipelineRunLabel.PIPELINE_TYPE] === 'build');

    it('should not fetch build pipeline runs until test pipeline runs are fully loaded', () => {
      const testGetNextPage = jest.fn();
      const buildGetNextPage = jest.fn();

      usePipelineRunsForCommitMock.mockImplementation(
        (_namespace, _appName, _commitName, _limit, _filterByComponents, plrType) => {
          if (plrType === PipelineRunType.TEST) {
            return [
              getTestPlrs(),
              true,
              undefined,
              testGetNextPage,
              { isFetchingNextPage: false, hasNextPage: true },
            ];
          }

          return [
            [],
            false,
            undefined,
            buildGetNextPage,
            { isFetchingNextPage: false, hasNextPage: false },
          ];
        },
      );

      renderWithQueryClient(<TestedComponent />);

      expect(usePipelineRunsForCommitMock).toHaveBeenCalledWith(
        null, // namespace should be null when test is not complete
        appName,
        'test-sha-1',
        undefined,
        false,
        PipelineRunType.BUILD,
      );
    });

    it('should fetch build pipeline runs after test pipeline runs are complete', () => {
      const testGetNextPage = jest.fn();
      const buildGetNextPage = jest.fn();

      usePipelineRunsForCommitMock.mockImplementation(
        (_namespace, _appName, _commitName, _limit, _filterByComponents, plrType) => {
          if (plrType === PipelineRunType.TEST) {
            return [
              getTestPlrs(),
              true,
              undefined,
              testGetNextPage,
              { isFetchingNextPage: false, hasNextPage: false },
            ];
          }

          return [
            getBuildPlrs(),
            true,
            undefined,
            buildGetNextPage,
            { isFetchingNextPage: false, hasNextPage: false },
          ];
        },
      );

      renderWithQueryClient(<TestedComponent />);

      expect(usePipelineRunsForCommitMock).toHaveBeenCalledWith(
        'test-ns', // namespace should be provided when test is complete
        appName,
        'test-sha-1',
        undefined,
        false,
        PipelineRunType.BUILD,
      );
    });

    it('should not fetch build if test is still loading', () => {
      usePipelineRunsForCommitMock.mockImplementation(
        (_namespace, _appName, _commitName, _limit, _filterByComponents, plrType) => {
          if (plrType === PipelineRunType.TEST) {
            return [
              [],
              false, // Still loading
              undefined,
              jest.fn(),
              { isFetchingNextPage: false, hasNextPage: false },
            ];
          }

          return [
            [],
            false,
            undefined,
            jest.fn(),
            { isFetchingNextPage: false, hasNextPage: false },
          ];
        },
      );

      renderWithQueryClient(<TestedComponent />);

      expect(usePipelineRunsForCommitMock).toHaveBeenCalledWith(
        null,
        appName,
        'test-sha-1',
        undefined,
        false,
        PipelineRunType.BUILD,
      );
    });

    it('should not fetch build if test has an error', () => {
      usePipelineRunsForCommitMock.mockImplementation(
        (_namespace, _appName, _commitName, _limit, _filterByComponents, plrType) => {
          if (plrType === PipelineRunType.TEST) {
            return [
              [],
              true,
              new Error('Test error'),
              jest.fn(),
              { isFetchingNextPage: false, hasNextPage: false },
            ];
          }

          return [
            [],
            false,
            undefined,
            jest.fn(),
            { isFetchingNextPage: false, hasNextPage: false },
          ];
        },
      );

      renderWithQueryClient(<TestedComponent />);

      // Verify BUILD was called with null namespace (disabled because test has error)
      expect(usePipelineRunsForCommitMock).toHaveBeenCalledWith(
        null,
        appName,
        'test-sha-1',
        undefined,
        false,
        PipelineRunType.BUILD,
      );
    });
  });
});
