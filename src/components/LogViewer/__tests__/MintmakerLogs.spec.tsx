import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFeatureFlags, useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { TaskRunKind, TaskRunStatus } from '~/types/task-run';
import { MintmakerLogs } from '../MintmakerLogs';

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: jest.fn(),
  useFeatureFlags: jest.fn(),
}));

jest.mock('~/shared/components/pipeline-run-logs/logs/LogsWrapperComponent', () => ({
  __esModule: true,
  default: () => <div data-test="logs-wrapper-component">Logs</div>,
}));

jest.mock('~/shared/components/status-box/StatusBox', () => ({
  LoadingBox: () => <div data-test="loading-indicator" />,
}));

const useTaskRunsMock = useTaskRunsForPipelineRuns as jest.Mock;
const useIsOnFeatureFlagMock = useIsOnFeatureFlag as jest.Mock;
const useFeatureFlagsMock = useFeatureFlags as jest.Mock;

const noNextPage = { isFetchingNextPage: false, hasNextPage: false };

const makePipelineRun = (overrides: Partial<PipelineRunKind> = {}): PipelineRunKind => ({
  kind: 'PipelineRun',
  apiVersion: 'tekton.dev/v1beta1',
  metadata: {
    name: 'mintmaker-run-1',
    namespace: 'mintmaker',
    creationTimestamp: '2023-01-01T00:00:00Z',
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

describe('MintmakerLogs', () => {
  beforeEach(() => {
    useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
    useIsOnFeatureFlagMock.mockReturnValue(true);
    useFeatureFlagsMock.mockReturnValue([{}, jest.fn()]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls useTaskRunsForPipelineRuns with the mintmaker namespace, run name, and build task', () => {
    render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
    expect(useTaskRunsMock).toHaveBeenCalledWith('mintmaker', 'mintmaker-run-1', 'build');
  });

  describe('KubeArchive logs feature flag off', () => {
    beforeEach(() => {
      useIsOnFeatureFlagMock.mockReturnValue(false);
    });

    it('renders a warning alert instead of logs when the KubeArchive logs flag is off', () => {
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      expect(screen.getByTestId('mintmaker-logs-alert')).toBeInTheDocument();
    });

    it('does not render the logs wrapper when the KubeArchive logs flag is off', () => {
      useTaskRunsMock.mockReturnValue([[makeTaskRun()], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('logs-wrapper-component')).not.toBeInTheDocument();
    });

    it('turns on the KubeArchive logs flag when the action link is clicked', async () => {
      const setFlag = jest.fn();
      useFeatureFlagsMock.mockReturnValue([{}, setFlag]);
      const user = userEvent.setup();

      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      await user.click(screen.getByRole('button', { name: 'Turn on KubeArchive logs' }));

      expect(setFlag).toHaveBeenCalledWith('kubearchive-logs', true);
    });
  });

  describe('loading state', () => {
    it('renders a loading indicator while task runs are not yet loaded', () => {
      useTaskRunsMock.mockReturnValue([[], false, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('does not render the logs wrapper while loading', () => {
      useTaskRunsMock.mockReturnValue([[], false, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
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
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
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
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('logs-wrapper-component')).not.toBeInTheDocument();
    });
  });

  describe('active task run with pod', () => {
    it('renders the logs wrapper when a task run with a pod is available', () => {
      useTaskRunsMock.mockReturnValue([[makeTaskRun()], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      expect(screen.getByTestId('logs-wrapper-component')).toBeInTheDocument();
    });

    it('does not render "No logs found" when logs are shown', () => {
      useTaskRunsMock.mockReturnValue([[makeTaskRun()], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('no-logs-found')).not.toBeInTheDocument();
    });

    it('does not render the waiting-for-task spinner when a task run is available', () => {
      useTaskRunsMock.mockReturnValue([[makeTaskRun()], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
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
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('logs-wrapper-component')).not.toBeInTheDocument();
      expect(screen.getByTestId('no-logs-found')).toBeInTheDocument();
    });
  });

  describe('running pipeline with no task run yet', () => {
    it('renders the waiting message while the pipeline is running and no task run exists', () => {
      useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makeRunningPipelineRun()} />);
      expect(screen.getByText(/Waiting for the task to start/)).toBeInTheDocument();
    });

    it('does not render "No logs found" when the pipeline is still running', () => {
      useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makeRunningPipelineRun()} />);
      expect(screen.queryByTestId('no-logs-found')).not.toBeInTheDocument();
    });
  });

  describe('no logs available (completed or failed with no task run)', () => {
    it('renders "No logs found" when loaded, not running, and no task run exists', () => {
      useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      expect(screen.getByTestId('no-logs-found')).toBeInTheDocument();
      expect(screen.getByText('No logs found')).toBeInTheDocument();
    });

    it('does not render the logs wrapper in the "no logs" state', () => {
      useTaskRunsMock.mockReturnValue([[], true, undefined, jest.fn(), noNextPage]);
      render(<MintmakerLogs dependencyRun={makePipelineRun()} />);
      expect(screen.queryByTestId('logs-wrapper-component')).not.toBeInTheDocument();
    });
  });
});
