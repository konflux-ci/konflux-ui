import { renderHook, render, screen } from '@testing-library/react';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { TaskRunKind, TaskRunStatus } from '~/types/task-run';
import { MintmakerLogViewer, useMintmakerLogViewerModal } from '../MintmakerLogViewer';

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

jest.mock('~/components/modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

jest.mock('~/shared/components/pipeline-run-logs/logs/LogsWrapperComponent', () => ({
  __esModule: true,
  default: () => <div data-test="logs-wrapper-component">Logs</div>,
}));

jest.mock('~/shared/components/status-box/StatusBox', () => ({
  LoadingBox: () => <div data-test="loading-indicator" />,
}));

const useTaskRunsMock = useTaskRunsForPipelineRuns as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;

const noNextPage = { isFetchingNextPage: false, hasNextPage: false };

const makePipelineRun = (overrides: Partial<PipelineRunKind> = {}): PipelineRunKind => ({
  kind: 'PipelineRun',
  apiVersion: 'tekton.dev/v1beta1',
  metadata: {
    name: 'mintmaker-run-1',
    namespace: 'mintmaker',
    creationTimestamp: '2023-01-01T00:00:00Z',
    labels: {
      [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: 'my-component',
    },
  },
  spec: {},
  status: {
    conditions: [{ status: 'True', type: 'Succeeded' }],
    startTime: '2023-01-01T00:00:00Z',
    completionTime: '2023-01-01T00:05:00Z',
  } as PipelineRunStatus,
  ...overrides,
});

const makeRunningPipelineRun = (overrides: Partial<PipelineRunKind> = {}): PipelineRunKind =>
  makePipelineRun({
    status: {
      conditions: [{ status: 'Unknown', type: 'Succeeded' }],
      startTime: '2023-01-01T00:00:00Z',
    } as PipelineRunStatus,
    ...overrides,
  });

const makeTaskRun = (overrides: Partial<TaskRunKind> = {}): TaskRunKind => ({
  kind: 'TaskRun',
  apiVersion: 'tekton.dev/v1',
  metadata: {
    name: 'mintmaker-run-1-build',
    namespace: 'mintmaker',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
  spec: {},
  status: {
    podName: 'mintmaker-run-1-build-pod',
    conditions: [{ status: 'True', type: 'Succeeded' }],
  } as TaskRunStatus,
  ...overrides,
});

describe('MintmakerLogViewer', () => {
  beforeEach(() => {
    useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
    useModalLauncherMock.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('metadata details', () => {
    it('always renders the run details section', () => {
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByTestId('mintmaker-run-details')).toBeInTheDocument();
    });

    it('shows the component label from pipeline run labels', () => {
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByText('my-component')).toBeInTheDocument();
    });

    it('shows "-" for component when the Mintmaker component label is absent', () => {
      const run = makePipelineRun({
        metadata: {
          name: 'mintmaker-run-1',
          namespace: 'mintmaker',
          creationTimestamp: '2023-01-01T00:00:00Z',
        },
      });
      render(<MintmakerLogViewer dependencyRun={run} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('shows the pipeline run name', () => {
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByText('mintmaker-run-1')).toBeInTheDocument();
    });

    it('calls useTaskRunsForPipelineRuns with the mintmaker namespace, run name, and build task', () => {
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(useTaskRunsMock).toHaveBeenCalledWith('mintmaker', 'mintmaker-run-1', 'build');
    });
  });

  describe('loading state', () => {
    it('renders a loading indicator while task runs are not yet loaded', () => {
      useTaskRunsMock.mockReturnValue([[], false, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('does not render the logs wrapper while loading', () => {
      useTaskRunsMock.mockReturnValue([[], false, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('logs-wrapper-component')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders an error message when task runs fetch fails', () => {
      useTaskRunsMock.mockReturnValue([
        [],
        true,
        new Error('500: Server error'),
        jest.fn(),
        noNextPage,
      ]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByText('Unable to load logs')).toBeInTheDocument();
    });

    it('does not render the logs wrapper on error', () => {
      useTaskRunsMock.mockReturnValue([
        [],
        true,
        new Error('500: Server error'),
        jest.fn(),
        noNextPage,
      ]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('logs-wrapper-component')).not.toBeInTheDocument();
    });
  });

  describe('active task run with pod', () => {
    it('renders the logs wrapper when a task run with a pod is available', () => {
      useTaskRunsMock.mockReturnValue([[makeTaskRun()], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByTestId('logs-wrapper-component')).toBeInTheDocument();
    });

    it('does not render "No logs found" when logs are shown', () => {
      useTaskRunsMock.mockReturnValue([[makeTaskRun()], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('no-logs-found')).not.toBeInTheDocument();
    });

    it('does not render the waiting-for-task spinner when a task run is available', () => {
      useTaskRunsMock.mockReturnValue([[makeTaskRun()], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.queryByText(/Waiting for the task to start/)).not.toBeInTheDocument();
    });

    it('falls through to the no-logs state when the task run has no pod name', () => {
      const taskRunWithoutPod = makeTaskRun({
        status: { conditions: [{ status: 'Unknown', type: 'Succeeded' }] } as TaskRunStatus,
      });
      useTaskRunsMock.mockReturnValue([
        [taskRunWithoutPod],
        true,
        undefined,
        jest.fn(),
        noNextPage,
      ]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('logs-wrapper-component')).not.toBeInTheDocument();
      expect(screen.getByTestId('no-logs-found')).toBeInTheDocument();
    });
  });

  describe('running pipeline with no task run yet', () => {
    it('renders the waiting message while the pipeline is running and no task run exists', () => {
      useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogViewer dependencyRun={makeRunningPipelineRun()} />);
      expect(screen.getByText(/Waiting for the task to start/)).toBeInTheDocument();
    });

    it('does not render "No logs found" when the pipeline is still running', () => {
      useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogViewer dependencyRun={makeRunningPipelineRun()} />);
      expect(screen.queryByTestId('no-logs-found')).not.toBeInTheDocument();
    });
  });

  describe('no logs available (completed or failed with no task run)', () => {
    it('renders "No logs found" when loaded, not running, and no task run exists', () => {
      useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.getByTestId('no-logs-found')).toBeInTheDocument();
      expect(screen.getByText('No logs found')).toBeInTheDocument();
    });

    it('does not render the logs wrapper in the "no logs" state', () => {
      useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogViewer dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('logs-wrapper-component')).not.toBeInTheDocument();
    });
  });
});

describe('useMintmakerLogViewerModal', () => {
  beforeEach(() => {
    useModalLauncherMock.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a function', () => {
    const { result } = renderHook(() => useMintmakerLogViewerModal(makePipelineRun()));
    expect(typeof result.current).toBe('function');
  });

  it('calls showModal when the returned function is invoked', () => {
    const showModal = jest.fn();
    useModalLauncherMock.mockReturnValue(showModal);

    const { result } = renderHook(() => useMintmakerLogViewerModal(makePipelineRun()));
    result.current();

    expect(showModal).toHaveBeenCalledTimes(1);
  });

  it('passes a launcher function to showModal', () => {
    const showModal = jest.fn();
    useModalLauncherMock.mockReturnValue(showModal);

    const { result } = renderHook(() => useMintmakerLogViewerModal(makePipelineRun()));
    result.current();

    expect(showModal).toHaveBeenCalledWith(expect.any(Function));
  });
});
