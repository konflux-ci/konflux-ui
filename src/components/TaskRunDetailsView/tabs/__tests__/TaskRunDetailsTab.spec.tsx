import { screen } from '@testing-library/react';
import { createK8sWatchResourceMock, routerRenderer } from '../../../../utils/test-utils';
import { testTaskRuns } from '../../../TaskRunListView/__data__/mock-TaskRun-data';
import TaskRunDetailsTab from '../TaskRunDetailsTab';

jest.mock('../../../Workspace/useWorkspaceInfo', () => ({
  useWorkspaceInfo: jest.fn(() => ({ namespace: 'test-ns', workspace: 'test-ws' })),
}));

jest.mock('../../../../hooks/useTektonResults');

jest.mock('../../../topology/factories/VisualizationFactory', () => () => <div />);

const watchResourceMock = createK8sWatchResourceMock();

describe('TaskRunDetailsTab', () => {
  it('should render the taskrun details tab', () => {
    watchResourceMock.mockReturnValue([[testTaskRuns[0]], true]);
    routerRenderer(<TaskRunDetailsTab />);
    expect(screen.queryByText('Task run details')).toBeInTheDocument();
  });

  it('should render the taskrun details tab for embeddedt taskrun', () => {
    watchResourceMock.mockReturnValue([[testTaskRuns[0]], true]);
    routerRenderer(<TaskRunDetailsTab />);
    expect(screen.queryByText('Task run details')).toBeInTheDocument();
  });

  it('should render the taskrun and task name and description', () => {
    watchResourceMock.mockReturnValue([[testTaskRuns[0]], true]);
    routerRenderer(<TaskRunDetailsTab />);
    expect(screen.queryByText('example')).toBeInTheDocument();
    expect(screen.queryByText('example-task')).toBeInTheDocument();
    expect(screen.queryByText('Task description goes here.')).toBeInTheDocument();
  });

  it('should render the plr link', () => {
    watchResourceMock.mockReturnValue([[testTaskRuns[0]], true]);
    routerRenderer(<TaskRunDetailsTab />);
    expect(screen.queryByRole('link', { name: /example-pipelinerun/ })).toBeInTheDocument();
  });

  it('should render application link', () => {
    watchResourceMock.mockReturnValue([[testTaskRuns[0]], true]);
    routerRenderer(<TaskRunDetailsTab />);
    expect(screen.queryByRole('link', { name: /example-app/ })).toBeInTheDocument();
  });

  it('should render log link', () => {
    watchResourceMock.mockReturnValue([[testTaskRuns[0]], true]);
    routerRenderer(<TaskRunDetailsTab />);
    expect(screen.queryByRole('link', { name: /logs/ })).toBeInTheDocument();
  });
});
