import { screen } from '@testing-library/react';
import { testTaskRuns } from '~/components/TaskRunListView/__data__/mock-TaskRun-data';
import { useTaskRuns } from '~/hooks/useTaskRuns';
import { PipelineRunLabel, PipelineRunType } from '../../../consts/pipelinerun';
import { useTRPipelineRuns } from '../../../hooks/useTektonResults';
import { createK8sWatchResourceMock, routerRenderer } from '../../../utils/test-utils';
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
jest.mock('../../../hooks/useTektonResults');
jest.mock('~/hooks/useTaskRuns', () => ({
  useTaskRuns: jest.fn(),
}));

const watchResourceMock = createK8sWatchResourceMock();
const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;
const useTaskRunsMock = useTaskRuns as jest.Mock;

describe('BuildLogViewer', () => {
  beforeEach(() => {
    useTaskRunsMock.mockReturnValue([testTaskRuns, true, undefined]);
  });

  it('should show empty box if pipelineRuns not found', () => {
    watchResourceMock.mockReturnValue([[], true]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    expect(screen.getByTestId('empty-message')).not.toBeNull();
    expect(screen.getByTestId('empty-message').innerHTML).toBe('No pipeline runs found');
  });

  it('should show component name', () => {
    watchResourceMock.mockReturnValue([[pipelineRunMock], true]);
    watchResourceMock.mockReturnValue([[pipelineRunMock], true]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    screen.getByText('basic-node-js');
  });

  it('should show pipeline run link', () => {
    watchResourceMock.mockReturnValue([[pipelineRunMock], true]);
    watchResourceMock.mockReturnValue([[pipelineRunMock], true]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    const plrLink = screen.getByText('basic-node-js-7c8nd');
    expect(plrLink.getAttribute('href')).toBe(
      '/ns//applications/purple-mermaid-app/pipelineruns/basic-node-js-7c8nd',
    );
  });

  it('should render PipelineRunLogs', () => {
    watchResourceMock.mockReturnValue([[pipelineRunMock], true]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);

    screen.getByTestId('logs-tasklist');
  });

  it('should show empty box if it is not a build pipelinerun', () => {
    const pipelineruns = [
      {
        ...pipelineRunMock,
        metadata: {
          ...pipelineRunMock.metadata,
          labels: {
            ...pipelineRunMock.metadata.labels,
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
          },
        },
      },
    ];
    watchResourceMock.mockReturnValue([
      pipelineruns.filter(
        (p) => p.metadata.labels[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
      ),
      true,
    ]);

    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    expect(screen.getByTestId('empty-message')).not.toBeNull();
    expect(screen.getByTestId('empty-message').innerHTML).toBe('No pipeline runs found');
  });

  it('should show loading box if pipelineRuns are being fetched', () => {
    watchResourceMock.mockReturnValue([[], false]);
    useTRPipelineRunsMock.mockReturnValue([[], false]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    expect(screen.getByTestId('loading-indicator')).not.toBeNull();
  });

  it('should handle error when fetching task runs', () => {
    watchResourceMock.mockReturnValue([[pipelineRunMock], true]);
    useTaskRunsMock.mockReturnValue([undefined, true, { code: 451 }]);
    routerRenderer(<BuildLogViewer component={componentCRMocks[0]} />);
    screen.getByText('Unable to load task runs');
  });
});
