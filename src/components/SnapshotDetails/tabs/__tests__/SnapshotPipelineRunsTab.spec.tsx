import { useParams } from 'react-router-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { screen, within } from '@testing-library/react';
import { useSnapshot } from '~/hooks/useSnapshots';
import { renderWithQueryClient } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { mockPipelineRuns } from '../../../../components/Components/__data__/mock-pipeline-run';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { useComponents } from '../../../../hooks/useComponents';
import { usePipelineRunsV2, usePipelineRunV2 } from '../../../../hooks/usePipelineRunsV2';
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

jest.mock('../../../../hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
  usePipelineRunV2: jest.fn(),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
  useComponent: jest.fn().mockReturnValue([{ metadata: { name: { test } } }, true]),
}));

jest.mock('../../../../hooks/useScanResults', () => ({
  useKarchScanResults: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
  usePLRVulnerabilities: jest.fn(() => ({ vulnerabilities: {}, fetchedPipelineRuns: [] })),
}));

jest.mock('../../../../hooks/useSearchParam', () => ({
  useSearchParamBatch: jest.fn(),
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
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;
const usePipelineRunV2Mock = usePipelineRunV2 as jest.Mock;
const useParamsMock = useParams as jest.Mock;
const useSnapshotMock = useSnapshot as jest.Mock;

const appName = 'my-test-app';

const snapShotPLRs = [
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
    usePipelineRunV2Mock.mockReturnValue([
      {
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
      },
      false,
      null,
    ]);
    useSnapshotMock.mockReturnValue([
      { metadata: { name: 'snap', namespace: 'test-ns' } },
      true,
      null,
    ]);
  });

  it('should render spinner if pipeline data is not loaded', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<SnapshotPipelineRunsTab />);
    screen.getByRole('progressbar');
  });

  it('should render empty state if no pipelinerun is present', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    usePipelineRunV2Mock.mockReturnValue([undefined, false, null]);
    renderWithQueryClient(<SnapshotPipelineRunsTab />);
    screen.getByText(/Keep tabs on components and activity/);
    screen.getByText(/Monitor your components with pipelines and oversee CI\/CD activity./);
    const button = screen.getByText('Add component');
    expect(button).toBeInTheDocument();
    expect(button.closest('a').href).toContain(
      `http://localhost/ns/test-ns/import?application=my-test-app`,
    );
  });

  it('should render pipelineRuns list when pipelineRuns are present', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      snapShotPLRs,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<SnapshotPipelineRunsTab />);
    screen.queryByText(/Pipeline runs/);

    // Find Name column header specifically in the table header
    const tableHeaders = screen.queryAllByRole('columnheader');
    const nameHeader = tableHeaders.find((header) => within(header).queryByText('Name'));
    expect(nameHeader).toBeTruthy();

    screen.queryByText('Started');
    screen.queryByText('Duration');
    screen.queryAllByText('Status');
    screen.queryAllByText('Type');
    screen.queryByText('Component');
  });

  it('should render both Build and Test pipelineruns in the pipelinerun list', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      snapShotPLRs,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<SnapshotPipelineRunsTab />);

    screen.queryByText('Build');
    expect(screen.queryAllByText('Test').length).toBeGreaterThan(0);
    screen.queryByText('python-sample-942fq');
    screen.queryByText('go-sample-s2f4f');
  });

  it('should render pipelineruns with Snapshot label instead of annotation as well', () => {
    usePipelineRunsV2Mock.mockReturnValue([
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
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<SnapshotPipelineRunsTab />);

    expect(screen.queryAllByText('Test').length).toBeGreaterThan(0);
    screen.queryByText('go-sample-s2f4f');
  });
});
