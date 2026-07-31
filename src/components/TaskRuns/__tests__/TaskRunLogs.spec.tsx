import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { runStatus } from '~/consts/pipelinerun';
import { TaskRunKind } from '../../../types';
import TaskRunLogs from '../TaskRunLogs';

describe('TaskRunLogs', () => {
  it('should render no logs found', () => {
    const result = render(
      <TaskRunLogs taskRun={null} namespace="test" status={runStatus.Running} />,
    );
    expect(result.queryByText('No logs found.')).toBeInTheDocument();
  });

  it('should render waiting to start', () => {
    const result = render(<TaskRunLogs taskRun={null} namespace="test" status={runStatus.Idle} />);
    expect(result.queryByText('Waiting on task to start.')).toBeInTheDocument();
  });

  it('should render no logs due to Skipped status', () => {
    const result = render(
      <TaskRunLogs taskRun={null} namespace="test" status={runStatus.Skipped} />,
    );
    expect(result.queryByText('No logs. This task was skipped.')).toBeInTheDocument();
  });

  it('should display failure message from status conditions when task run failed without a pod', () => {
    const failedTaskRun = {
      metadata: { name: 'test-task-run' },
      spec: { taskRef: { name: 'test-task' } },
      status: {
        conditions: [
          {
            type: 'Succeeded',
            status: 'False',
            message: 'failed to create task run pod "test-pod": error creating container',
          },
        ],
      },
    } as unknown as TaskRunKind;

    render(<TaskRunLogs taskRun={failedTaskRun} namespace="test" status={runStatus.Failed} />);
    const messageElement = screen.getByText(
      'failed to create task run pod "test-pod": error creating container',
    );
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.closest('.pf-v6-c-code-block')).toBeInTheDocument();
    expect(screen.queryByText('No logs found.')).not.toBeInTheDocument();
  });

  it('should fall back to "No logs found." when task run has no status conditions', () => {
    const failedTaskRunNoConditions = {
      metadata: { name: 'test-task-run' },
      spec: { taskRef: { name: 'test-task' } },
      status: {},
    } as unknown as TaskRunKind;

    render(
      <TaskRunLogs
        taskRun={failedTaskRunNoConditions}
        namespace="test"
        status={runStatus.Failed}
      />,
    );
    expect(screen.getByText('No logs found.')).toBeInTheDocument();
  });
});
