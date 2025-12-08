import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskRunKind } from '~/types';
import LogsTaskDuration from '../LogsTaskDuration';

describe('LogsTaskDuration', () => {
  const mockTaskRunWithDuration: TaskRunKind = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'TaskRun',
    metadata: {
      name: 'test-taskrun',
      namespace: 'test-namespace',
      uid: 'test-uid',
    },
    spec: {
      taskRef: {
        name: 'test-task',
      },
    },
    status: {
      startTime: '2024-01-01T10:00:00Z',
      completionTime: '2024-01-01T10:10:45Z',
    },
  };

  const mockTaskRunWithoutCompletion: TaskRunKind = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'TaskRun',
    metadata: {
      name: 'test-taskrun',
      namespace: 'test-namespace',
      uid: 'test-uid',
    },
    spec: {
      taskRef: {
        name: 'test-task',
      },
    },
    status: {
      startTime: '2024-01-01T10:00:00Z',
    },
  };

  const mockTaskRunWithoutStartTime: TaskRunKind = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'TaskRun',
    metadata: {
      name: 'test-taskrun',
      namespace: 'test-namespace',
      uid: 'test-uid',
    },
    spec: {
      taskRef: {
        name: 'test-task',
      },
    },
    status: {},
  };

  const mockTaskRunWithoutStatus: TaskRunKind = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'TaskRun',
    metadata: {
      name: 'test-taskrun',
      namespace: 'test-namespace',
      uid: 'test-uid',
    },
    spec: {
      taskRef: {
        name: 'test-task',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering with duration', () => {
    it('should render duration when both startTime and completionTime are provided', () => {
      render(<LogsTaskDuration taskRun={mockTaskRunWithDuration} />);

      const durationElement = screen.getByTestId('logs-task-duration');
      expect(durationElement).toBeInTheDocument();
      expect(durationElement).toHaveTextContent('[Duration: 10 minutes 45 seconds]');
    });

    it('should render duration when only startTime is provided (uses current time)', () => {
      render(<LogsTaskDuration taskRun={mockTaskRunWithoutCompletion} />);

      const durationElement = screen.getByTestId('logs-task-duration');
      expect(durationElement).toBeInTheDocument();
      // Duration will be calculated from startTime to now, so just check it exists and has expected format
      expect(durationElement.textContent).toMatch(/\[Duration: .+\]/);
    });
  });

  describe('rendering without duration', () => {
    it('should return null when startTime is not provided', () => {
      const { container } = render(<LogsTaskDuration taskRun={mockTaskRunWithoutStartTime} />);

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('logs-task-duration')).not.toBeInTheDocument();
    });

    it('should return null when status is not provided', () => {
      const { container } = render(<LogsTaskDuration taskRun={mockTaskRunWithoutStatus} />);

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('logs-task-duration')).not.toBeInTheDocument();
    });

    it('should return null when taskRun status is undefined', () => {
      const taskRunNoStatus: TaskRunKind = {
        ...mockTaskRunWithDuration,
        status: undefined,
      };

      const { container } = render(<LogsTaskDuration taskRun={taskRunNoStatus} />);

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('logs-task-duration')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle taskRun with null status', () => {
      const taskRunNullStatus: TaskRunKind = {
        ...mockTaskRunWithDuration,
        status: null,
      };

      const { container } = render(<LogsTaskDuration taskRun={taskRunNullStatus} />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle various duration formats - hours, minutes, and seconds', () => {
      const taskRunWithLongDuration: TaskRunKind = {
        ...mockTaskRunWithDuration,
        status: {
          startTime: '2024-01-01T10:00:00Z',
          completionTime: '2024-01-01T11:23:45Z', // 1 hour 23 minutes 45 seconds
        },
      };

      render(<LogsTaskDuration taskRun={taskRunWithLongDuration} />);

      const durationElement = screen.getByTestId('logs-task-duration');
      expect(durationElement).toHaveTextContent('[Duration: 1 hour 23 minutes 45 seconds]');
    });

    it('should handle very short durations', () => {
      const taskRunWithShortDuration: TaskRunKind = {
        ...mockTaskRunWithDuration,
        status: {
          startTime: '2024-01-01T10:00:00Z',
          completionTime: '2024-01-01T10:00:02Z', // 2 seconds
        },
      };

      render(<LogsTaskDuration taskRun={taskRunWithShortDuration} />);

      const durationElement = screen.getByTestId('logs-task-duration');
      expect(durationElement).toHaveTextContent('[Duration: 2 seconds]');
    });

    it('should handle very long durations', () => {
      const taskRunWithVeryLongDuration: TaskRunKind = {
        ...mockTaskRunWithDuration,
        status: {
          startTime: '2024-01-01T10:00:00Z',
          completionTime: '2024-01-01T15:30:15Z', // 5 hours 30 minutes 15 seconds
        },
      };

      render(<LogsTaskDuration taskRun={taskRunWithVeryLongDuration} />);

      const durationElement = screen.getByTestId('logs-task-duration');
      expect(durationElement).toHaveTextContent('[Duration: 5 hours 30 minutes 15 seconds]');
    });
  });

  describe('re-rendering', () => {
    it('should update duration when taskRun changes', () => {
      const taskRunShort: TaskRunKind = {
        ...mockTaskRunWithDuration,
        status: {
          startTime: '2024-01-01T10:00:00Z',
          completionTime: '2024-01-01T10:05:30Z', // 5 minutes 30 seconds
        },
      };

      const { rerender } = render(<LogsTaskDuration taskRun={taskRunShort} />);

      expect(screen.getByTestId('logs-task-duration')).toHaveTextContent(
        '[Duration: 5 minutes 30 seconds]',
      );

      rerender(<LogsTaskDuration taskRun={mockTaskRunWithDuration} />);

      expect(screen.getByTestId('logs-task-duration')).toHaveTextContent(
        '[Duration: 10 minutes 45 seconds]',
      );
    });

    it('should remove duration when taskRun changes to one without startTime', () => {
      const { rerender } = render(<LogsTaskDuration taskRun={mockTaskRunWithDuration} />);

      expect(screen.getByTestId('logs-task-duration')).toBeInTheDocument();

      rerender(<LogsTaskDuration taskRun={mockTaskRunWithoutStartTime} />);

      expect(screen.queryByTestId('logs-task-duration')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render as a span element', () => {
      render(<LogsTaskDuration taskRun={mockTaskRunWithDuration} />);

      const durationElement = screen.getByTestId('logs-task-duration');
      expect(durationElement.tagName).toBe('SPAN');
    });

    it('should have data-test attribute for testing', () => {
      render(<LogsTaskDuration taskRun={mockTaskRunWithDuration} />);

      const durationElement = screen.getByTestId('logs-task-duration');
      expect(durationElement).toHaveAttribute('data-test', 'logs-task-duration');
    });
  });
});
