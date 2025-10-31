import { screen } from '@testing-library/react';
import { TaskRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { useTaskRunV2 } from '../../../../hooks/useTaskRunsV2';
import { renderWithQueryClientAndRouter } from '../../../../unit-test-utils/rendering-utils';
import { runStatus } from '../../../../utils/pipeline-utils';
import { createUseParamsMock } from '../../../../utils/test-utils';
import { testTaskRuns } from '../../../TaskRunListView/__data__/mock-TaskRun-data';
import TaskRunLogsTab from '../TaskRunLogsTab';

jest.mock('../../../../hooks/useTaskRunsV2', () => ({
  useTaskRunV2: jest.fn(),
}));

// Mock the TaskRunLogs component
jest.mock('../../../TaskRuns/TaskRunLogs', () => ({
  __esModule: true,
  default: ({
    taskRun,
    status,
    namespace,
  }: {
    taskRun: TaskRunKind;
    status: runStatus;
    namespace: string;
  }) => (
    <div data-test="taskrun-logs">
      TaskRunLogs - TaskRun: {taskRun?.metadata?.name || 'null'}, Status: {status}, Namespace:{' '}
      {namespace}
    </div>
  ),
}));

const mockUseTaskRunV2 = useTaskRunV2 as jest.Mock;

describe('TaskRunLogsTab', () => {
  createUseParamsMock({ taskRunName: 'test-taskrun' });
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render TaskRunLogs with correct props when taskrun is loaded', () => {
    const mockTaskRun = testTaskRuns[0];
    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(screen.getByTestId('taskrun-logs')).toBeInTheDocument();
    expect(
      screen.getByText(
        `TaskRunLogs - TaskRun: ${mockTaskRun.metadata.name}, Status: ${runStatus.Failed}, Namespace: test-ns`,
      ),
    ).toBeInTheDocument();
  });

  it('should render TaskRunLogs with null taskrun when data is not loaded', () => {
    mockUseTaskRunV2.mockReturnValue([null, false]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(screen.getByTestId('taskrun-logs')).toBeInTheDocument();
    expect(
      screen.getByText('TaskRunLogs - TaskRun: null, Status: Pending, Namespace: test-ns'),
    ).toBeInTheDocument();
  });

  it('should render TaskRunLogs with undefined taskrun when data is not available', () => {
    mockUseTaskRunV2.mockReturnValue([undefined, true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(screen.getByTestId('taskrun-logs')).toBeInTheDocument();
    expect(
      screen.getByText('TaskRunLogs - TaskRun: null, Status: Pending, Namespace: test-ns'),
    ).toBeInTheDocument();
  });

  it('should call useTaskRunV2 with correct parameters from URL', () => {
    mockUseTaskRunV2.mockReturnValue([testTaskRuns[0], true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(mockUseTaskRunV2).toHaveBeenCalledWith('test-ns', 'test-taskrun');
  });

  it('should handle different taskrun statuses correctly', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      status: {
        conditions: [
          {
            type: 'Succeeded',
            status: 'False',
            reason: 'Failed',
          },
        ],
      },
    };
    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(screen.getByTestId('taskrun-logs')).toBeInTheDocument();
    expect(
      screen.getByText(
        `TaskRunLogs - TaskRun: ${mockTaskRun.metadata.name}, Status: ${runStatus.Failed}, Namespace: test-ns`,
      ),
    ).toBeInTheDocument();
  });

  it('should handle running taskrun status', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      status: {
        conditions: [
          {
            type: 'Succeeded',
            status: 'Unknown',
            reason: 'Running',
          },
        ],
      },
    };
    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(screen.getByTestId('taskrun-logs')).toBeInTheDocument();
    expect(
      screen.getByText(
        `TaskRunLogs - TaskRun: ${mockTaskRun.metadata.name}, Status: ${runStatus.Running}, Namespace: test-ns`,
      ),
    ).toBeInTheDocument();
  });

  it('should handle cancelled taskrun status', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      status: {
        conditions: [
          {
            type: 'Succeeded',
            status: 'False',
            reason: 'Cancelled',
          },
        ],
      },
    };
    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(screen.getByTestId('taskrun-logs')).toBeInTheDocument();
    expect(
      screen.getByText(
        `TaskRunLogs - TaskRun: ${mockTaskRun.metadata.name}, Status: ${runStatus.Cancelled}, Namespace: test-ns`,
      ),
    ).toBeInTheDocument();
  });

  it('should handle skipped taskrun status', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      status: {
        conditions: [
          {
            type: 'Succeeded',
            status: 'False',
            reason: 'Skipped',
          },
        ],
      },
    };
    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(screen.getByTestId('taskrun-logs')).toBeInTheDocument();
    expect(
      screen.getByText(
        `TaskRunLogs - TaskRun: ${mockTaskRun.metadata.name}, Status: ${runStatus.Failed}, Namespace: test-ns`,
      ),
    ).toBeInTheDocument();
  });

  it('should handle taskrun with no status conditions', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      status: {},
    };
    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(screen.getByTestId('taskrun-logs')).toBeInTheDocument();
    expect(
      screen.getByText(
        `TaskRunLogs - TaskRun: ${mockTaskRun.metadata.name}, Status: ${runStatus.Pending}, Namespace: test-ns`,
      ),
    ).toBeInTheDocument();
  });

  it('should handle taskrun with no status', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      status: undefined,
    };
    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(screen.getByTestId('taskrun-logs')).toBeInTheDocument();
    expect(
      screen.getByText(
        `TaskRunLogs - TaskRun: ${mockTaskRun.metadata.name}, Status: ${runStatus.Pending}, Namespace: test-ns`,
      ),
    ).toBeInTheDocument();
  });

  it('should use correct namespace from useNamespace hook', () => {
    mockUseTaskRunV2.mockReturnValue([testTaskRuns[0], true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(
      screen.getByText('TaskRunLogs - TaskRun: example, Status: Failed, Namespace: test-ns'),
    ).toBeInTheDocument();
  });

  it('should handle different taskrun names from URL params', () => {
    createUseParamsMock({ taskRunName: 'different-taskrun' });
    mockUseTaskRunV2.mockReturnValue([testTaskRuns[0], true]);

    renderWithQueryClientAndRouter(<TaskRunLogsTab />);

    expect(mockUseTaskRunV2).toHaveBeenCalledWith('test-ns', 'different-taskrun');
  });
});
