import { screen } from '@testing-library/react';
import { testTaskRuns } from '~/components/TaskRunListView/__data__/mock-TaskRun-data';
import { useLatestBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { routerRenderer } from '~/utils/test-utils';
import { componentCRMocks } from '../../ApplicationDetails/__data__/mock-data';
import { pipelineRunMock } from '../__data__/pipelineRunMocks';
import { BuildLogViewer } from '../BuildLogViewer';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});
jest.mock('~/hooks/useLatestPushBuildPipeline', () => ({
  useLatestBuildPipelineRunForComponentV2: jest.fn(),
}));

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

const useLatestBuildMock = useLatestBuildPipelineRunForComponentV2 as jest.Mock;
const useTaskRunsMock = useTaskRunsForPipelineRuns as jest.Mock;

describe('BuildLogViewer', () => {
  beforeEach(() => {
    useTaskRunsMock.mockReturnValue([testTaskRuns, true, undefined]);
  });

  it('should show empty box if pipelineRuns not found', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, undefined]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    expect(screen.getByTestId('empty-message')).not.toBeNull();
    expect(screen.getByTestId('empty-message').innerHTML).toBe('No pipeline runs found');
  });

  it('should show component name', () => {
    useLatestBuildMock.mockReturnValue([pipelineRunMock, true, undefined]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    screen.getByText('basic-node-js');
  });

  it('should show pipeline run link', () => {
    useLatestBuildMock.mockReturnValue([pipelineRunMock, true, undefined]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    const plrLink = screen.getByText('basic-node-js-7c8nd');
    expect(plrLink.getAttribute('href')).toBe(
      '/ns//applications/purple-mermaid-app/pipelineruns/basic-node-js-7c8nd',
    );
  });

  it('should render PipelineRunLogs', () => {
    useLatestBuildMock.mockReturnValue([pipelineRunMock, true, undefined]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);

    screen.getByTestId('logs-tasklist');
  });

  it('should show loading box if pipelineRuns are being fetched', () => {
    useLatestBuildMock.mockReturnValue([undefined, false, undefined]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    expect(screen.getByTestId('loading-indicator')).not.toBeNull();
  });

  it('should handle error when fetching task runs', () => {
    useLatestBuildMock.mockReturnValue([pipelineRunMock, true, undefined]);
    useTaskRunsMock.mockReturnValue([undefined, true, { code: 451 }]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    screen.getByText('Unable to load task runs');
  });

  it('should call useLatestBuildPipelineRunForComponentV2 with component namespace and name', () => {
    useLatestBuildMock.mockReturnValue([undefined, true, undefined]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    expect(useLatestBuildMock).toHaveBeenCalledWith(
      componentCRMocks[0].metadata.namespace,
      componentCRMocks[0].metadata.name,
    );
  });
});
