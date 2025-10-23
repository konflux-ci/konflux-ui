import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useSearchParam } from '~/hooks/useSearchParam';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { PipelineRunKind, TaskRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import PipelineRunLogsTab from '../PipelineRunLogsTab';

const mockPipelineRun = {
  metadata: {
    name: 'test-pipeline-run',
    namespace: 'test-namespace',
  },
  spec: {},
  status: {},
} as PipelineRunKind;

const mockTaskRuns = [
  {
    metadata: {
      name: 'task-run-1',
    },
  },
] as TaskRunKind[];

// PipelineRunLogs component has its own tests. We mock it here to focus on
// testing PipelineRunLogsTab's logic: loading data, handling errors and loading states,
// and managing active task state.
jest.mock('../../../../../shared', () => ({
  PipelineRunLogs: jest.fn(({ obj, taskRuns, activeTask, onActiveTaskChange }) => (
    <div data-test="pipeline-run-logs">
      PipelineRunLogs - {obj?.metadata?.name} - tasks: {taskRuns?.length || 0} - active:{' '}
      {activeTask || 'none'}
      <button onClick={() => onActiveTaskChange('task-1')}>Set Task</button>
      <button onClick={() => onActiveTaskChange(undefined)}>Clear Task</button>
    </div>
  )),
}));

const mockSetActiveTask = jest.fn();
const mockUnsetActiveTask = jest.fn();

jest.mock('../../../../../hooks/usePipelineRunsV2');
jest.mock('../../../../../hooks/useTaskRunsV2');
jest.mock('../../../../../hooks/useSearchParam');

const mockUsePipelineRunV2 = jest.mocked(usePipelineRunV2);
const mockUseTaskRunsForPipelineRuns = jest.mocked(useTaskRunsForPipelineRuns);
const mockUseSearchParam = jest.mocked(useSearchParam);

describe('PipelineRunLogsTab', () => {
  const mockNamespace = 'test-namespace';
  const mockPipelineRunName = 'test-pipeline-run';

  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);

  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });
    mockUseSearchParam.mockReturnValue([undefined, mockSetActiveTask, mockUnsetActiveTask]);
  });

  it('should render spinner when loading pipeline run data', () => {
    mockUsePipelineRunV2.mockReturnValue([null, false, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([[], true, undefined]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-run-logs')).not.toBeInTheDocument();
  });

  it('should render spinner when loading task runs', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([[], false, undefined]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-run-logs')).not.toBeInTheDocument();
  });

  it('should call hooks with correct parameters', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(mockUsePipelineRunV2).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
    expect(mockUseSearchParam).toHaveBeenCalledWith('task', undefined);
  });

  it('should render PipelineRunLogs when data is loaded', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByTestId('pipeline-run-logs')).toBeInTheDocument();
    expect(
      screen.getByText(/PipelineRunLogs - test-pipeline-run - tasks: 1 - active: none/),
    ).toBeInTheDocument();
  });

  it('should render error state when pipeline run fails to load', () => {
    const mockError = { message: 'Pipeline run not found', code: 404 };
    mockUsePipelineRunV2.mockReturnValue([null, true, mockError]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([[], true, undefined]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-run-logs')).not.toBeInTheDocument();
  });

  it('should render error state when task runs fail to load', () => {
    const mockError = { message: 'Internal Server Error', code: 500 };
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([null, true, mockError]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByText('Unable to load task runs')).toBeInTheDocument();
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-run-logs')).not.toBeInTheDocument();
  });

  it('should manage active task state from URL search params', () => {
    const mockActiveTask = 'task-123';
    mockUseSearchParam.mockReturnValue([mockActiveTask, jest.fn(), jest.fn()]);
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    routerRenderer(<PipelineRunLogsTab />);

    expect(screen.getByText(/active: task-123/)).toBeInTheDocument();
  });

  it('should handle active task change by setting search param', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    routerRenderer(<PipelineRunLogsTab />);

    const setTaskButton = screen.getByText('Set Task');
    setTaskButton.click();

    expect(mockSetActiveTask).toHaveBeenCalledWith('task-1');
  });

  it('should handle active task change by unsetting search param', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRunsForPipelineRuns.mockReturnValue([mockTaskRuns, true, undefined]);

    routerRenderer(<PipelineRunLogsTab />);

    const clearTaskButton = screen.getByText('Clear Task');
    clearTaskButton.click();

    expect(mockUnsetActiveTask).toHaveBeenCalled();
  });
});
