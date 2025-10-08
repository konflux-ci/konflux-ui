import { useParams } from 'react-router-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { render, screen } from '@testing-library/react';
import { MockSnapshots } from '~/components/Commits/CommitDetails/visualization/__data__/MockCommitWorkflowData';
import { useK8sAndKarchResource } from '~/hooks/useK8sAndKarchResources';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { mockPipelineRuns } from '../../../../components/Components/__data__/mock-pipeline-run';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { useComponents } from '../../../../hooks/useComponents';
import { usePipelineRun, usePipelineRuns } from '../../../../hooks/usePipelineRuns';
import { useSearchParamBatch } from '../../../../hooks/useSearchParam';
import { mockComponentsData } from '../../../ApplicationDetails/__data__';
import { PipelineRunListRow } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';
import SnapshotPipelineRunsTab from '../SnapshotPipelineRunsTab';

const useNamespaceMock = mockUseNamespaceHook('test-ns');

jest.mock('~/hooks/useSnapshots', () => ({
  useSnapshot: jest.fn(() => [{ metadata: { name: 'snap' } }, false, null]),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/usePipelineRuns', () => ({
  usePipelineRun: jest.fn(),
  usePipelineRuns: jest.fn(),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
  useComponent: jest.fn().mockReturnValue([{ metadata: { name: { test } } }, true]),
}));

jest.mock('../../../../hooks/useScanResults', () => ({
  usePLRVulnerabilities: jest.fn(() => ({ vulnerabilities: {}, fetchedPipelineRuns: [] })),
}));

jest.mock('../../../../hooks/useSearchParam', () => ({
  useSearchParamBatch: jest.fn(),
}));

jest.mock('../../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResource: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: jest.fn(),
    useParams: jest.fn(),
    useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
  };
});

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
const usePipelineRunsMock = usePipelineRuns as jest.Mock;
const usePipelineRunMock = usePipelineRun as jest.Mock;
const useParamsMock = useParams as jest.Mock;
const useSnapshotMock = useK8sAndKarchResource as jest.Mock;

const appName = 'my-test-app';

const mockSnapshots: IntegrationTestScenarioKind[] = [...MockSnapshots];

const buildPLR = {
  ...mockPipelineRuns[1],
  metadata: {
    ...mockPipelineRuns[1].metadata,
    labels: {
      ...mockPipelineRuns[1].metadata.labels,
      [PipelineRunLabel.PIPELINE_TYPE]: 'build',
    },
    annotations: {
      ...mockPipelineRuns[2].metadata.annotations,
      [PipelineRunLabel.SNAPSHOT]: 'test-snapshot',
    },
  },
};

const testPLRs = [
  {
    ...mockPipelineRuns[0],
    metadata: {
      ...mockPipelineRuns[0].metadata,
      labels: {
        ...mockPipelineRuns[0].metadata.labels,
        [PipelineRunLabel.PIPELINE_TYPE]: 'test',
      },
      annotations: {
        ...mockPipelineRuns[2].metadata.annotations,
        [PipelineRunLabel.SNAPSHOT]: 'test-snapshot',
      },
    },
  },
  {
    ...mockPipelineRuns[2],
    metadata: {
      ...mockPipelineRuns[2].metadata,
      labels: {
        ...mockPipelineRuns[2].metadata.labels,
        [PipelineRunLabel.PIPELINE_TYPE]: 'test',
      },
      annotations: {
        ...mockPipelineRuns[2].metadata.annotations,
        [PipelineRunLabel.SNAPSHOT]: 'test-snapshot',
      },
    },
  },
];

describe('SnapshotPipelinerunsTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({
      applicationName: appName,

      snapshotName: 'test-snapshot',
    });
    useSearchParamBatchMock.mockImplementation(() => mockUseSearchParamBatch());
    useComponentsMock.mockReturnValue([mockComponentsData, true]);
    useNamespaceMock.mockReturnValue('test-ns');
    useSnapshotMock.mockReturnValue({
      data: mockSnapshots[0],
      isLoading: false,
    });
  });

  it('should render spinner if pipeline data is not loaded', () => {
    usePipelineRunMock.mockReturnValue([null, true, false]);
    usePipelineRunsMock.mockReturnValue([[], false]);
    render(<SnapshotPipelineRunsTab />);
    screen.getByRole('progressbar');
  });

  it('should render empty state if no pipelinerun is present', () => {
    usePipelineRunMock.mockReturnValue([undefined, false, false]);
    usePipelineRunsMock.mockReturnValue([[], true, false]);
    render(<SnapshotPipelineRunsTab />);
    screen.queryByText(/Not found/);
    const button = screen.queryByText('Add component');
    expect(button).toBeInTheDocument();
    expect(button.closest('a').href).toContain(
      `http://localhost/ns/test-ns/import?application=my-test-app`,
    );
  });

  it('should render pipelineRuns list when test pipelineRuns are present', () => {
    usePipelineRunMock.mockReturnValue([undefined, false, false]);
    usePipelineRunsMock.mockReturnValue([[testPLRs], true, false]);
    render(<SnapshotPipelineRunsTab />);
    screen.queryByText(/Pipeline runs/);
    screen.queryByText('Name');
    screen.queryByText('Started');
    screen.queryByText('Duration');
    screen.queryAllByText('Status');
    screen.queryAllByText('Type');
    screen.queryByText('Component');
    screen.queryByText('Test');
  });

  it('should render pipelineRuns list when build pipelineRun is present', () => {
    usePipelineRunMock.mockReturnValue([buildPLR, true, false]);
    usePipelineRunsMock.mockReturnValue([[], true, false, () => {}, {}]);
    render(<SnapshotPipelineRunsTab />);
    screen.queryByText(/Pipeline runs/);
    screen.queryByText('Name');
    screen.queryByText('Started');
    screen.queryByText('Duration');
    screen.queryAllByText('Status');
    screen.queryAllByText('Type');
    screen.queryByText('Component');
    screen.queryByText('Build');
  });

  it('should render both Build and Test pipelineruns in the pipelinerun list', () => {
    usePipelineRunMock.mockReturnValue([buildPLR, true, false]);
    usePipelineRunsMock.mockReturnValue([[testPLRs], true, false, () => {}, {}]);
    render(<SnapshotPipelineRunsTab />);

    screen.queryByText('Build');
    screen.queryByText('Test');
    screen.queryByText('python-sample-942fq');
    screen.queryByText('go-sample-s2f4f');
  });

  it('should render pipelineruns with Snapshot label instead of annotation as well', () => {
    usePipelineRunMock.mockReturnValue([buildPLR, true, false]);
    usePipelineRunsMock.mockReturnValue([
      [
        {
          ...mockPipelineRuns[0],
          metadata: {
            ...mockPipelineRuns[0].metadata,
            labels: {
              ...mockPipelineRuns[0].metadata.labels,
              [PipelineRunLabel.PIPELINE_TYPE]: 'test',
              [PipelineRunLabel.SNAPSHOT]: 'test-snapshot',
            },
            annotations: {
              ...mockPipelineRuns[2].metadata.annotations,
            },
          },
        },
      ],
      true,
      false,
      () => {},
      { hasNextPage: false },
    ]);
    render(<SnapshotPipelineRunsTab />);

    screen.queryByText('Test');
    screen.queryByText('go-sample-s2f4f');
  });
});
