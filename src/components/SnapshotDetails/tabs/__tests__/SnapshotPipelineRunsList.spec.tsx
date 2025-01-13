import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockPipelineRuns } from '../../../../components/Components/__data__/mock-pipeline-run';
import { PipelineRunLabel, PipelineRunType } from '../../../../consts/pipelinerun';
import { useComponents } from '../../../../hooks/useComponents';
import { usePLRVulnerabilities } from '../../../../hooks/useScanResults';
import { useSearchParam } from '../../../../hooks/useSearchParam';
import { useSnapshots } from '../../../../hooks/useSnapshots';
import { PipelineRunStatus } from '../../../../types';
import { createUseWorkspaceInfoMock } from '../../../../utils/test-utils';
import { mockComponentsData } from '../../../ApplicationDetails/__data__';
import { PipelineRunListRow } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';
import SnapshotPipelineRunsList from '../SnapshotPipelineRunsList';

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
}));

jest.mock('../../../../hooks/useSnapshots', () => ({
  useSnapshots: jest.fn(),
}));

jest.mock('../../../../hooks/useSearchParam', () => ({
  useSearchParam: jest.fn(),
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

const useSearchParamMock = useSearchParam as jest.Mock;
const useComponentsMock = useComponents as jest.Mock;
const usePLRVulnerabilitiesMock = usePLRVulnerabilities as jest.Mock;
const mockUseSnapshots = useSnapshots as jest.Mock;

const params = {};

const mockUseSearchParam = (name: string) => {
  const setter = (value) => {
    params[name] = value;
  };
  const unset = () => {
    params[name] = '';
  };
  return [params[name], setter, unset];
};

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

describe('SnapshotPipelinerunsTab', () => {
  createUseWorkspaceInfoMock({ namespace: 'test-ns', workspace: 'test-ws' });

  beforeEach(() => {
    useSearchParamMock.mockImplementation(mockUseSearchParam);
    useComponentsMock.mockReturnValue([mockComponentsData, true]);
    mockUseSnapshots.mockReturnValue([[{ metadata: { name: 'snp1' } }], true]);
  });

  it('should render spinner if pipeline data is not loaded', () => {
    render(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={[]}
        loaded={false}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    screen.getByRole('progressbar');
  });

  it('should render empty state if no pipelinerun is present', () => {
    render(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={[]}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    screen.queryAllByText(/Not found/);
    const button = screen.queryByText('Add component');
    expect(button).toBeInTheDocument();
    expect(button.closest('a').href).toContain(
      `http://localhost/workspaces/test-ws/import?application=my-test-app`,
    );
  });

  it('should render pipelineruns with snapshot labels instead of annotations', () => {
    render(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    expect(screen.queryByText('plr-with snapshot-label-only')).toBeInTheDocument();
  });

  it('should render entire pipelineRuns list when no filter value', () => {
    render(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
    expect(screen.queryByText('go-sample-s2f4f')).toBeInTheDocument();
    expect(screen.queryByText('go-sample-vvs')).toBeInTheDocument();
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    expect(filter.value).toBe('');
  });

  it('should render filtered pipelinerun list and should call nextPage', async () => {
    const r = render(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
    expect(screen.queryByText('go-sample-s2f4f')).toBeInTheDocument();
    expect(screen.queryByText('go-sample-vvs')).toBeInTheDocument();

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, {
      target: { value: 'go-sample-s2f4f' },
    });

    usePLRVulnerabilitiesMock.mockReturnValue({
      vulnerabilities: {},
      fetchedPipelineRuns: snapShotPLRs.map((plr) => plr.metadata.name),
    });
    expect(filter.value).toBe('go-sample-s2f4f');

    r.rerender(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).not.toBeInTheDocument();
    });
  });

  it('should render filtered pipelinerun list by name', async () => {
    usePLRVulnerabilitiesMock.mockReturnValue({
      vulnerabilities: {},
      fetchedPipelineRuns: snapShotPLRs.map((plr) => plr.metadata.name),
    });
    const r = render(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    fireEvent.change(filter, {
      target: { value: 'python-sample-942fq' },
    });

    expect(filter.value).toBe('python-sample-942fq');

    r.rerender(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).not.toBeInTheDocument();
    });

    // clean up for next tests
    fireEvent.change(filter, {
      target: { value: '' },
    });
    r.rerender(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    expect(filter.value).toBe('');
  });

  it('should render filtered pipelinerun list by status', async () => {
    usePLRVulnerabilitiesMock.mockReturnValue({
      vulnerabilities: {},
      fetchedPipelineRuns: snapShotPLRs.map((plr) => plr.metadata.name),
    });
    const r = render(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );

    const statusFilter = screen.getByRole('button', {
      name: /status filter menu/i,
    });
    fireEvent.click(statusFilter);
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');

    const succeededOption = screen.getByLabelText(/succeeded/i, {
      selector: 'input',
    });
    fireEvent.click(succeededOption);

    r.rerender(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    expect(succeededOption).toBeChecked();
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(succeededOption);
    r.rerender(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    expect(succeededOption).not.toBeChecked();
  });

  it('should render filtered pipelinerun list by type', async () => {
    usePLRVulnerabilitiesMock.mockReturnValue({
      vulnerabilities: {},
      fetchedPipelineRuns: snapShotPLRs.map((plr) => plr.metadata.name),
    });
    const r = render(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );

    const typeFilter = screen.getByRole('button', {
      name: /type filter menu/i,
    });
    fireEvent.click(typeFilter);
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');

    const buildOption = screen.getByLabelText(/build/i, {
      selector: 'input',
    });
    fireEvent.click(buildOption);
    r.rerender(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    expect(buildOption).toBeChecked();

    r.rerender(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).not.toBeInTheDocument();
    });

    // clean up for other tests
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(buildOption);
    r.rerender(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    expect(buildOption).not.toBeChecked();
  });

  it('should clear the filters and render the list again in the table', async () => {
    const r = render(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    fireEvent.change(filter, {
      target: { value: 'no-match' },
    });

    expect(filter.value).toBe('no-match');

    r.rerender(
      <SnapshotPipelineRunsList
        applicationName={appName}
        getNextPage={null}
        snapshotPipelineRuns={snapShotPLRs}
        loaded={true}
        nextPageProps={{ hasNextPage: true }}
      />,
    );
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).not.toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).not.toBeInTheDocument();
      expect(screen.queryByText('No results found')).toBeInTheDocument();
      expect(
        screen.queryByText(
          'No results match this filter criteria. Clear all filters and try again.',
        ),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.queryByRole('button', { name: 'Clear all filters' }));
    await waitFor(() => {
      expect(screen.queryByText('python-sample-942fq')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-s2f4f')).toBeInTheDocument();
      expect(screen.queryByText('go-sample-vvs')).toBeInTheDocument();
    });
  });
});
