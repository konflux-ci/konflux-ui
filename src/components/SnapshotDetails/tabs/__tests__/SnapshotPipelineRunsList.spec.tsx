import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { mockPipelineRuns } from '../../../../components/Components/__data__/mock-pipeline-run';
import { PipelineRunLabel, PipelineRunType } from '../../../../consts/pipelinerun';
import { useComponents } from '../../../../hooks/useComponents';
import { useSearchParamBatch } from '../../../../hooks/useSearchParam';
import { PipelineRunStatus } from '../../../../types';
import { mockComponentsData } from '../../../ApplicationDetails/__data__';
import { PipelineRunListRow } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';
import SnapshotPipelineRunsList from '../SnapshotPipelineRunsList';

jest.useFakeTimers();

jest.mock('~/hooks/useSnapshots', () => ({
  useSnapshot: jest.fn(() => [{ metadata: { name: 'snap' } }, false, null]),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
  useComponent: jest.fn().mockReturnValue([{ metadata: { name: { test } } }, true]),
}));

jest.mock('../../../../hooks/useScanResults', () => ({
  usePLRVulnerabilities: jest.fn(() => ({ vulnerabilities: {}, fetchedPipelineRuns: [] })),
}));

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
}));

jest.mock('../../../../hooks/useSearchParam', () => ({
  useSearchParamBatch: jest.fn(),
}));
const useNamespaceMock = mockUseNamespaceHook('test-ns');

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
            {props.data.map((d, i) => (
              <tr key={i}>
                <PipelineRunListRow columns={null} obj={d} />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const useSearchParamBatchMock = useSearchParamBatch as jest.Mock;
const useComponentsMock = useComponents as jest.Mock;

const appName = 'my-test-app';

const snapShotPLRs = [
  {
    apiVersion: mockPipelineRuns[0].apiVersion,
    kind: mockPipelineRuns[0].kind,
    metadata: {
      ...mockPipelineRuns[0].metadata,
      labels: {
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
      },
      annotations: {
        [PipelineRunLabel.SNAPSHOT]: 'test-snapshot',
      },
    },
    spec: null,
    status: {
      conditions: [
        {
          status: 'True',
          type: 'Succeeded',
        },
      ],
    } as PipelineRunStatus,
  },
  {
    apiVersion: mockPipelineRuns[0].apiVersion,
    kind: mockPipelineRuns[0].kind,
    metadata: {
      ...mockPipelineRuns[1].metadata,
      labels: {
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
      },
      annotations: {
        [PipelineRunLabel.SNAPSHOT]: 'test-snapshot',
      },
    },
    spec: null,
    status: null,
  },
  {
    apiVersion: mockPipelineRuns[0].apiVersion,
    kind: mockPipelineRuns[0].kind,
    metadata: {
      ...mockPipelineRuns[2].metadata,
      labels: {
        ...mockPipelineRuns[2].metadata.labels,
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
      },
      annotations: {
        ...mockPipelineRuns[2].metadata.annotations,
        [PipelineRunLabel.SNAPSHOT]: 'test-snapshot',
      },
    },
    spec: null,
    status: null,
  },

  {
    apiVersion: mockPipelineRuns[0].apiVersion,
    kind: mockPipelineRuns[0].kind,
    metadata: {
      ...mockPipelineRuns[2].metadata,
      name: 'plr-with snapshot-label-only',
      labels: {
        ...mockPipelineRuns[2].metadata.labels,
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
        [PipelineRunLabel.SNAPSHOT]: 'test-snapshot',
      },
      annotations: {
        ...mockPipelineRuns[2].metadata.annotations,
      },
    },
    spec: null,
    status: null,
  },
];

const TestedComponent = ({ name, pipelineruns, loaded }) => (
  <FilterContextProvider filterParams={['name', 'status', 'type']}>
    <SnapshotPipelineRunsList
      applicationName={name}
      getNextPage={null}
      snapshotPipelineRuns={pipelineruns}
      loaded={loaded}
      nextPageProps={{ hasNextPage: true }}
    />
  </FilterContextProvider>
);

describe('SnapshotPipelinerunsTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useSearchParamBatchMock.mockImplementation(() => mockUseSearchParamBatch());
    useNamespaceMock.mockReturnValue('test-ns');
    useComponentsMock.mockReturnValue([mockComponentsData, true]);
  });

  it('should render spinner if pipeline data is not loaded', () => {
    render(<TestedComponent name={appName} pipelineruns={[]} loaded={false} />);
    screen.getByRole('progressbar');
  });

  it('should render empty state if no pipelinerun is present', () => {
    render(<TestedComponent name={appName} pipelineruns={[]} loaded={true} />);
    screen.queryAllByText(/Not found/);
    const button = screen.queryByText('Add component');
    expect(button).toBeInTheDocument();
    expect(button.closest('a').href).toContain(
      `http://localhost/ns/test-ns/import?application=my-test-app`,
    );
  });

  it('should render pipelineruns with snapshot labels instead of annotations', () => {
    render(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    expect(screen.queryByText('plr-with snapshot-label-only')).toBeInTheDocument();
  });

  it('should render entire pipelineRuns list when no filter value', () => {
    render(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
    expect(screen.queryByText('go-sample-s2f4f')).toBeInTheDocument();
    expect(screen.queryByText('go-sample-vvs')).toBeInTheDocument();
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    expect(filter.value).toBe('');
  });

  it('should render filtered pipelinerun list and should call nextPage', async () => {
    const r = render(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
    expect(screen.queryByText('go-sample-s2f4f')).toBeInTheDocument();
    expect(screen.queryByText('go-sample-vvs')).toBeInTheDocument();

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, {
      target: { value: 'go-sample-s2f4f' },
    });
    expect(filter.value).toBe('go-sample-s2f4f');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    r.rerender(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).not.toBeInTheDocument();
    });
  });

  it('should render filtered pipelinerun list by name', async () => {
    const r = render(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    fireEvent.change(filter, {
      target: { value: 'python-sample-942fq' },
    });

    expect(filter.value).toBe('python-sample-942fq');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    r.rerender(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).not.toBeInTheDocument();
    });

    // clean up for next tests
    fireEvent.change(filter, {
      target: { value: '' },
    });
    r.rerender(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    expect(filter.value).toBe('');
  });

  it('should render filtered pipelinerun list by status', async () => {
    const r = render(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);

    const statusFilter = screen.getByRole('button', {
      name: /status filter menu/i,
    });
    fireEvent.click(statusFilter);
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');

    const succeededOption = screen.getByLabelText(/succeeded/i, {
      selector: 'input',
    });
    fireEvent.click(succeededOption);

    r.rerender(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    expect(succeededOption).toBeChecked();
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(succeededOption);
    r.rerender(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    expect(succeededOption).not.toBeChecked();
  });

  it('should render filtered pipelinerun list by type', async () => {
    const r = render(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);

    const typeFilter = screen.getByRole('button', {
      name: /type filter menu/i,
    });
    fireEvent.click(typeFilter);
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');

    const buildOption = screen.getByLabelText(/build/i, {
      selector: 'input',
    });
    fireEvent.click(buildOption);
    r.rerender(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    expect(buildOption).toBeChecked();

    r.rerender(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(buildOption);
    r.rerender(<TestedComponent name={appName} pipelineruns={snapShotPLRs} loaded={true} />);
    expect(buildOption).not.toBeChecked();
  });
});
