import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { PipelineRunGroupVersionKind, SnapshotGroupVersionKind } from '../../../models';
import { IntegrationTestScenarioKind } from '../../../types/coreBuildService';
import { WatchK8sResource } from '../../../types/k8s';
import {
  createK8sWatchResourceMock,
  renderWithQueryClientAndRouter,
} from '../../../utils/test-utils';
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

const watchResourceMock = createK8sWatchResourceMock();

const mockSnapshots: IntegrationTestScenarioKind[] = [...MockSnapshots];

const getMockedResources = (params: WatchK8sResource) => {
  if (params?.groupVersionKind === SnapshotGroupVersionKind) {
    return [mockSnapshots.find((t) => !params.name || t.metadata.name === params.name), true];
  }
  if (params?.groupVersionKind === PipelineRunGroupVersionKind) {
    return [[pipelineWithCommits[0]], true];
  }
  return [[], true];
};

const errorSnapshotResources = (params: WatchK8sResource) => {
  if (params?.groupVersionKind === SnapshotGroupVersionKind) {
    return [mockSnapshots[0], true];
  }
  if (params?.groupVersionKind === PipelineRunGroupVersionKind) {
    return [[pipelineWithCommits[0]], true];
  }
  return [[], true];
};

describe('SnapshotDetailsView', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({
      snapshotName: 'my-test-output-1',
      applicationName: 'my-test-output',
    });
    (useCommitStatus as jest.Mock).mockReturnValueOnce(['-', true]);
  });

  it('should render loading indicator', () => {
    watchResourceMock.mockReturnValue([[], false]);
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    screen.getByRole('progressbar');
  });

  it('should show error state if test cannot be loaded', () => {
    watchResourceMock.mockReturnValue([
      [],
      false,
      { message: 'Application does not exist', code: 404 },
    ]);
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    screen.getByText('404: Page not found');
  });

  it('should display snapshot data when loaded', () => {
    watchResourceMock.mockImplementation(getMockedResources);
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    expect(screen.getByTestId('snapshot-header-details')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-name').innerHTML).toBe('my-test-output-1');
  });

  it('should display correct breadcrumbs', () => {
    watchResourceMock.mockImplementation(getMockedResources);
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    expect(screen.getByText(/Snapshots/)).toBeInTheDocument();
  });

  it('should show EnvProvisionError', () => {
    mockSnapshots[0].metadata.deletionTimestamp = '1';
    watchResourceMock.mockImplementation(errorSnapshotResources);
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
    watchResourceMock.mockImplementation(errorSnapshotResources);
    useParamsMock.mockReturnValue({
      snapshotName: 'my-test-output-2',
      applicationName: 'my-test-output',
    });
    renderWithQueryClientAndRouter(<SnapshotDetails />);
    screen.queryByText('scn 2');
  });
});
