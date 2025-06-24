import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useK8sAndKarchResource } from '../../../hooks/useK8sAndKarchResources';
import { usePipelineRun } from '../../../hooks/usePipelineRuns';
import { PipelineRunGroupVersionKind, SnapshotGroupVersionKind } from '../../../models';
import { IntegrationTestScenarioKind } from '../../../types/coreBuildService';
import { WatchK8sResource } from '../../../types/k8s';
import { renderWithQueryClientAndRouter } from '../../../utils/test-utils';
import { pipelineWithCommits } from '../../Commits/__data__/pipeline-with-commits';
import { useCommitStatus } from '../../Commits/commit-status';
import { MockSnapshots } from '../../Commits/CommitDetails/visualization/__data__/MockCommitWorkflowData';
import SnapshotDetails from '../SnapshotDetailsView';

jest.mock('../../Commits/commit-status', () => ({
  useCommitStatus: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: () => {},
    useParams: jest.fn(),
  };
});

jest.mock('../../../hooks/useTektonResults');

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const useParamsMock = useParams as jest.Mock;

jest.mock('../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResource: jest.fn(),
}));

jest.mock('../../../hooks/usePipelineRuns', () => ({
  usePipelineRun: jest.fn(),
}));

const useSnapshotMock = useK8sAndKarchResource as jest.Mock;
const usePipelineRunMock = usePipelineRun as jest.Mock;

const mockSnapshots: IntegrationTestScenarioKind[] = [...MockSnapshots];

const errorSnapshotResources = (params: WatchK8sResource) => {
  if (params?.groupVersionKind === SnapshotGroupVersionKind) {
    return { data: mockSnapshots[0], isLoading: false };
  }
  if (params?.groupVersionKind === PipelineRunGroupVersionKind) {
    return { data: pipelineWithCommits[0], isLoading: false };
  }
  return { data: undefined, isLoading: false };
};

describe('SnapshotDetailsView', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({
      snapshotName: 'my-test-output-1',
      applicationName: 'my-test-output',
    });
    (useCommitStatus as jest.Mock).mockReturnValueOnce(['-', true]);
    usePipelineRunMock.mockReturnValue([pipelineWithCommits[0], true, false]);
  });

  it('should render loading indicator', () => {
    useSnapshotMock.mockReturnValue({ data: undefined, isLoading: true });
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    screen.getByRole('progressbar');
  });

  it('should show error state if test cannot be loaded', () => {
    useSnapshotMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      hasError: true,
      archiveError: { message: 'Application does not exist', code: 404 },
    });
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    screen.getByText('404: Page not found');
  });

  it('should display snapshot data when loaded', () => {
    useSnapshotMock.mockReturnValue({
      data: mockSnapshots[0],
      isLoading: false,
    });
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    expect(screen.getByTestId('snapshot-header-details')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-name').innerHTML).toBe('my-test-output-1');
  });

  it('should display correct breadcrumbs', () => {
    useSnapshotMock.mockReturnValue({
      data: mockSnapshots[0],
      isLoading: false,
    });
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    expect(screen.getByText(/Snapshots/)).toBeInTheDocument();
  });

  it('should show EnvProvisionError', () => {
    mockSnapshots[0].metadata.deletionTimestamp = '1';
    useSnapshotMock.mockImplementation(errorSnapshotResources);
    useParamsMock.mockReturnValue({
      snapshotName: 'my-test-output-2',
      applicationName: 'my-test-output',
    });
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    screen.queryByTestId('env-provision-err-alert');
    screen.queryByText('Failed for app-sample-go-basic-enterprise-contract');
  });

  it('should show failed scenario on EnvProvisionError', () => {
    mockSnapshots[0].metadata.deletionTimestamp = '1';
    useSnapshotMock.mockImplementation(errorSnapshotResources);
    useParamsMock.mockReturnValue({
      snapshotName: 'my-test-output-2',
      applicationName: 'my-test-output',
    });
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    screen.queryByText('scn 2');
  });

  it('should render without crashing when snapshot has no labels', () => {
    useSnapshotMock.mockReturnValue({
      data: mockSnapshots[0],
      isLoading: false,
    });
    useParamsMock.mockReturnValue({
      snapshotName: 'my-test-output-no-labels',
      applicationName: 'my-test-output',
    });
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    expect(screen.getByTestId('snapshot-header-details')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-name').innerHTML).toBe('my-test-output-no-labels');
  });
});
