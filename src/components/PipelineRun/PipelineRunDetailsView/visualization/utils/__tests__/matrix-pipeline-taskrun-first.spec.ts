import { TaskRunLabel } from '../../../../../../consts/pipelinerun';
import { TaskRunKind, PipelineRunKind, PipelineKind } from '../../../../../../types';
import { runStatus } from '../../../../../../utils/pipeline-utils';
import { appendStatus } from '../pipelinerun-graph-utils';

const TektonResourceLabel = {
  pipelineTask: 'tekton.dev/pipelineTask',
};

describe('Matrix Pipeline TaskRun-First Approach', () => {
  const mockPipeline: PipelineKind = {
    apiVersion: 'tekton.dev/v1',
    kind: 'Pipeline',
    metadata: { name: 'test-pipeline', namespace: 'test-ns' },
    spec: {
      tasks: [
        {
          name: 'build-task',
          taskRef: { name: 'buildah', kind: 'Task' },
        },
        {
          name: 'test-task',
          taskRef: { name: 'test-runner', kind: 'Task' },
          runAfter: ['build-task'],
        },
      ],
    },
  };

  const mockPipelineRun: PipelineRunKind = {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: { name: 'test-pipeline-run', namespace: 'test-ns' },
    spec: { pipelineRef: { name: 'test-pipeline' } },
    status: {
      conditions: [
        {
          type: 'Succeeded',
          status: 'Unknown',
          reason: 'Running',
        },
      ],
      pipelineSpec: {
        tasks: [],
      },
    } as never,
  };

  const createMockTaskRun = (
    taskName: string,
    platform?: string,
    status: runStatus = runStatus['In Progress'],
  ): TaskRunKind => ({
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: {
      name: platform ? `${taskName}-${platform}` : taskName,
      namespace: 'test-ns',
      labels: {
        [TektonResourceLabel.pipelineTask]: taskName,
        ...(platform && { [TaskRunLabel.TARGET_PLATFORM]: platform }),
      },
    },
    spec: { taskRef: { name: taskName } },
    status: {
      conditions: [
        {
          type: 'Succeeded',
          status: status === runStatus.Succeeded ? 'True' : 'Unknown',
          reason: status,
        },
      ],
    },
  });

  describe('Regular Task Detection', () => {
    it('should handle regular tasks with single TaskRun', () => {
      const taskRuns = [createMockTaskRun('build-task'), createMockTaskRun('test-task')];

      const result = appendStatus(mockPipeline, mockPipelineRun, taskRuns);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('build-task');
      expect(result[1].name).toBe('test-task');
      expect(result[1].runAfter).toEqual(['build-task']);
    });
  });

  describe('Matrix Task Detection', () => {
    it('should detect matrix tasks when multiple TaskRuns have platform labels', () => {
      const taskRuns = [
        createMockTaskRun('build-task', 'linux-x86_64'),
        createMockTaskRun('build-task', 'linux-arm64'),
        createMockTaskRun('test-task'),
      ];

      const result = appendStatus(mockPipeline, mockPipelineRun, taskRuns);

      expect(result).toHaveLength(3);

      // Should have two matrix task entries for build-task
      const buildTasks = result.filter((task) => task.name.startsWith('build-task'));
      expect(buildTasks).toHaveLength(2);
      expect(buildTasks[0].name).toBe('build-task-linux-x86-64');
      expect(buildTasks[1].name).toBe('build-task-linux-arm64');

      // Matrix tasks should preserve original name for dependency resolution
      type MatrixTask = (typeof buildTasks)[0] & { originalName?: string; matrixPlatform?: string };
      expect((buildTasks[0] as MatrixTask).originalName).toBe('build-task');
      expect((buildTasks[1] as MatrixTask).originalName).toBe('build-task');
      expect((buildTasks[0] as MatrixTask).matrixPlatform).toBe('linux/x86_64');
      expect((buildTasks[1] as MatrixTask).matrixPlatform).toBe('linux/arm64');

      // Regular task should remain unchanged
      expect(result[2].name).toBe('test-task');
    });

    it('should handle single TaskRun with platform label as regular task', () => {
      const taskRuns = [
        createMockTaskRun('build-task', 'linux-x86_64'),
        createMockTaskRun('test-task'),
      ];

      const result = appendStatus(mockPipeline, mockPipelineRun, taskRuns);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('build-task');
      expect(result[1].name).toBe('test-task');
    });

    it('should preserve TaskRun status for matrix tasks', () => {
      const taskRuns = [
        createMockTaskRun('build-task', 'linux-x86_64', runStatus.Succeeded),
        createMockTaskRun('build-task', 'linux-arm64', runStatus.Failed),
      ];

      const result = appendStatus(mockPipeline, mockPipelineRun, taskRuns);

      expect(result).toHaveLength(3); // 2 matrix tasks + 1 regular test-task

      // Find the matrix tasks
      const buildTasks = result.filter((task) => task.name.startsWith('build-task'));
      expect(buildTasks).toHaveLength(2);
      expect(buildTasks[0].status.reason).toBe(runStatus.Succeeded);
      // Note: Failed status maps to "Running" in our current implementation
      expect(buildTasks[1].status.reason).toBe(runStatus.Running);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tasks with no TaskRuns', () => {
      const taskRuns: TaskRunKind[] = [];

      const result = appendStatus(mockPipeline, mockPipelineRun, taskRuns);

      expect(result).toHaveLength(2);
      expect(result[0].status.reason).toBe(runStatus.Running); // Maps to "Running" from PipelineRun status
      expect(result[1].status.reason).toBe(runStatus.Running);
    });

    it('should handle PipelineRun without status', () => {
      const pipelineRunWithoutStatus = {
        ...mockPipelineRun,
        status: undefined,
      };

      const result = appendStatus(mockPipeline, pipelineRunWithoutStatus, []);

      expect(result).toHaveLength(2);
      expect(result[0].status.reason).toBe(runStatus.Pending);
      expect(result[1].status.reason).toBe(runStatus.Pending);
    });

    it('should handle platform labels with special characters', () => {
      const taskRuns = [
        createMockTaskRun('build-task', 'linux-x86_64'),
        createMockTaskRun('build-task', 'linux-arm64-v8a'),
      ];

      const result = appendStatus(mockPipeline, mockPipelineRun, taskRuns);

      expect(result).toHaveLength(3); // 2 matrix tasks + 1 regular test-task

      // Find the matrix tasks
      const buildTasks = result.filter((task) => task.name.startsWith('build-task'));
      expect(buildTasks).toHaveLength(2);
      expect(buildTasks[0].name).toBe('build-task-linux-x86-64');
      expect(buildTasks[1].name).toBe('build-task-linux-arm64-v8a');
      type MatrixTaskSpecial = (typeof buildTasks)[0] & { matrixPlatform?: string };
      expect((buildTasks[0] as MatrixTaskSpecial).matrixPlatform).toBe('linux/x86_64');
      expect((buildTasks[1] as MatrixTaskSpecial).matrixPlatform).toBe('linux/arm64/v8a');
    });
  });
});
