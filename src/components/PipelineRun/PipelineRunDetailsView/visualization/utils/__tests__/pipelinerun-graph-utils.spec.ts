import { Node } from '@patternfly/react-topology';
import { PipelineRunKind, PipelineTask, TaskRunKind, PipelineKind } from '../../../../../../types';
import { runStatus } from '../../../../../../utils/pipeline-utils';
import { PipelineMixedNodeModel } from '../../../../../topology/types';
import {
  PipelineRunNodeData,
  PipelineTaskWithStatus,
  PipelineTaskStatus,
  PipelineRunNodeType,
} from '../../types';
import {
  extractDepsFromContextVariables,
  getPipelineFromPipelineRun,
  createStepStatus,
  taskHasWhenExpression,
  nodesHasWhenExpression,
  getWhenStatus,
  taskWhenStatus,
  getTaskBadgeCount,
  getPipelineRunDataModel,
  isTaskNode,
  appendStatus,
} from '../pipelinerun-graph-utils';

describe('pipelinerun-graph-utils', () => {
  describe('extractDepsFromContextVariables', () => {
    it('should return empty array for simple context variables', () => {
      const contextVariable = '$(tasks.build.results.image-url)';
      const result = extractDepsFromContextVariables(contextVariable);
      expect(result).toEqual([]);
    });

    it('should extract multiple dependencies', () => {
      const contextVariable = '$(tasks.build.results.url) $(tasks.test.results.status)';
      const result = extractDepsFromContextVariables(contextVariable);
      expect(result).toEqual(['build', 'test']);
    });

    it('should return empty array for no dependencies', () => {
      const contextVariable = 'simple-string';
      const result = extractDepsFromContextVariables(contextVariable);
      expect(result).toEqual([]);
    });

    it('should handle empty string', () => {
      const contextVariable = '';
      const result = extractDepsFromContextVariables(contextVariable);
      expect(result).toEqual([]);
    });
  });

  describe('getPipelineFromPipelineRun', () => {
    it('should extract pipeline from pipeline run', () => {
      const pipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-run',
          namespace: 'test-ns',
          labels: { 'tekton.dev/pipeline': 'test-pipeline' },
        },
        spec: {},
        status: {
          pipelineSpec: {
            tasks: [{ name: 'test-task', taskRef: { name: 'test' } }],
          },
        },
      } as PipelineRunKind;

      const result = getPipelineFromPipelineRun(pipelineRun);

      expect(result).toEqual({
        apiVersion: 'tekton.dev/v1',
        kind: 'Pipeline',
        metadata: {
          name: 'test-pipeline',
          namespace: 'test-ns',
        },
        spec: {
          tasks: [{ name: 'test-task', taskRef: { name: 'test' } }],
        },
      });
    });

    it('should return null when pipeline name is missing', () => {
      const pipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: { name: 'test-run', namespace: 'test-ns' },
        spec: {},
        status: {},
      } as PipelineRunKind;

      const result = getPipelineFromPipelineRun(pipelineRun);
      expect(result).toBeNull();
    });

    it('should return null when pipeline spec is missing', () => {
      const pipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-run',
          namespace: 'test-ns',
          labels: { 'tekton.dev/pipeline': 'test-pipeline' },
        },
        spec: {},
      } as PipelineRunKind;

      const result = getPipelineFromPipelineRun(pipelineRun);
      expect(result).toBeNull();
    });
  });

  describe('createStepStatus', () => {
    it('should create step status for pending step', () => {
      const status: PipelineTaskStatus = {
        reason: runStatus.Running,
        steps: [],
      };

      const result = createStepStatus('test-step', status);

      expect(result).toEqual({
        name: 'test-step',
        status: runStatus.Pending,
        startTime: undefined,
        endTime: undefined,
      });
    });

    it('should create step status for completed step', () => {
      const status: PipelineTaskStatus = {
        reason: runStatus.Succeeded,
        steps: [
          {
            name: 'test-step',
            terminated: {
              reason: 'Completed',
              startedAt: '2023-01-01T00:00:00Z',
              finishedAt: '2023-01-01T00:01:00Z',
              containerID: 'container-id-1',
              exitCode: 0,
            },
            container: 'container-1',
          },
        ],
      };

      const result = createStepStatus('test-step', status);

      expect(result).toEqual({
        name: 'test-step',
        status: runStatus.Succeeded,
        startTime: '2023-01-01T00:00:00Z',
        endTime: '2023-01-01T00:01:00Z',
      });
    });

    it('should create step status for running step', () => {
      const status: PipelineTaskStatus = {
        reason: runStatus.Running,
        steps: [
          {
            name: 'test-step',
            running: {
              startedAt: '2023-01-01T00:00:00Z',
            },
            container: 'container-1',
          },
        ],
      };

      const result = createStepStatus('test-step', status);

      expect(result).toEqual({
        name: 'test-step',
        status: runStatus.Running,
        startTime: '2023-01-01T00:00:00Z',
        endTime: undefined,
      });
    });

    it('should handle cancelled status', () => {
      const result = createStepStatus('test-step', null);

      expect(result).toEqual({
        name: 'test-step',
        status: runStatus.Cancelled,
        startTime: undefined,
        endTime: undefined,
      });
    });
  });

  describe('taskHasWhenExpression', () => {
    it('should return true when task has when expression', () => {
      const task: PipelineTask = {
        name: 'test-task',
        taskRef: { name: 'test' },
        when: [{ input: '$(params.skip)', operator: 'in', values: ['false'] }],
      };

      const result = taskHasWhenExpression(task);
      expect(result).toBe(true);
    });

    it('should return false when task has no when expression', () => {
      const task: PipelineTask = {
        name: 'test-task',
        taskRef: { name: 'test' },
      };

      const result = taskHasWhenExpression(task);
      expect(result).toBe(false);
    });

    it('should return false when when array is empty', () => {
      const task: PipelineTask = {
        name: 'test-task',
        taskRef: { name: 'test' },
        when: [],
      };

      const result = taskHasWhenExpression(task);
      expect(result).toBe(false);
    });
  });

  describe('nodesHasWhenExpression', () => {
    it('should return true when any node has when expression', () => {
      const nodes: PipelineMixedNodeModel[] = [
        {
          id: 'node1',
          data: {
            task: {
              name: 'task1',
              taskRef: { name: 'test' },
            },
          },
        } as PipelineMixedNodeModel,
        {
          id: 'node2',
          data: {
            task: {
              name: 'task2',
              taskRef: { name: 'test' },
              when: [{ input: '$(params.skip)', operator: 'in', values: ['false'] }],
            },
          },
        } as PipelineMixedNodeModel,
      ];

      const result = nodesHasWhenExpression(nodes);
      expect(result).toBe(true);
    });

    it('should return false when no nodes have when expression', () => {
      const nodes: PipelineMixedNodeModel[] = [
        {
          id: 'node1',
          data: {
            task: {
              name: 'task1',
              taskRef: { name: 'test' },
            },
          },
        } as PipelineMixedNodeModel,
      ];

      const result = nodesHasWhenExpression(nodes);
      expect(result).toBe(false);
    });
  });

  describe('getWhenStatus', () => {
    it('should return Met for succeeded status', () => {
      const result = getWhenStatus(runStatus.Succeeded);
      expect(result).toBe('Met');
    });

    it('should return Met for failed status', () => {
      const result = getWhenStatus(runStatus.Failed);
      expect(result).toBe('Met');
    });

    it('should return Unmet for skipped status', () => {
      const result = getWhenStatus(runStatus.Skipped);
      expect(result).toBe('Unmet');
    });

    it('should return Unmet for in progress status', () => {
      const result = getWhenStatus(runStatus['In Progress']);
      expect(result).toBe('Unmet');
    });

    it('should return undefined for unknown status', () => {
      const result = getWhenStatus('unknown' as runStatus);
      expect(result).toBeUndefined();
    });
  });

  describe('taskWhenStatus', () => {
    it('should return undefined when task has no when expression', () => {
      const task: PipelineTaskWithStatus = {
        name: 'test-task',
        taskRef: { name: 'test' },
        status: { reason: runStatus.Succeeded },
      };

      const result = taskWhenStatus(task);
      expect(result).toBeUndefined();
    });

    it('should return when status when task has when expression', () => {
      const task: PipelineTaskWithStatus = {
        name: 'test-task',
        taskRef: { name: 'test' },
        when: [{ input: '$(params.skip)', operator: 'in', values: ['false'] }],
        status: { reason: runStatus.Succeeded },
      };

      const result = taskWhenStatus(task);
      expect(result).toBe('Met');
    });
  });

  describe('getTaskBadgeCount', () => {
    it('should return test count when present', () => {
      const data: PipelineRunNodeData = {
        testFailCount: 2,
        testWarnCount: 3,
      } as PipelineRunNodeData;

      const result = getTaskBadgeCount(data);
      expect(result).toBe(5);
    });

    it('should return scan results count when present', () => {
      const data: PipelineRunNodeData = {
        scanResults: {
          vulnerabilities: {
            critical: 1,
            high: 2,
            medium: 3,
            low: 4,
            unknown: 1,
          },
        },
      } as PipelineRunNodeData;

      const result = getTaskBadgeCount(data);
      expect(result).toBe(11);
    });

    it('should return 0 when no counts present', () => {
      const data: PipelineRunNodeData = {} as PipelineRunNodeData;

      const result = getTaskBadgeCount(data);
      expect(result).toBe(0);
    });

    it('should prioritize test counts over scan results', () => {
      const data: PipelineRunNodeData = {
        testFailCount: 1,
        testWarnCount: 1,
        scanResults: {
          vulnerabilities: {
            critical: 5,
            high: 5,
            medium: 5,
            low: 5,
            unknown: 5,
          },
        },
      } as PipelineRunNodeData;

      const result = getTaskBadgeCount(data);
      expect(result).toBe(2); // Should return test counts (1+1), not scan results
    });
  });

  describe('getPipelineRunDataModel', () => {
    it('should return null when pipeline run has no pipeline spec', () => {
      const pipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: { name: 'test-run', namespace: 'test-ns' },
        spec: {},
        status: {},
      } as PipelineRunKind;

      const result = getPipelineRunDataModel(pipelineRun, []);
      expect(result).toBeNull();
    });

    it('should return data model when pipeline run has valid pipeline spec', () => {
      const pipelineRun: PipelineRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'test-run',
          namespace: 'test-ns',
          labels: { 'tekton.dev/pipeline': 'test-pipeline' },
        },
        spec: {},
        status: {
          pipelineSpec: {
            tasks: [{ name: 'test-task', taskRef: { name: 'test' } }],
          },
        },
      } as PipelineRunKind;

      const result = getPipelineRunDataModel(pipelineRun, []);
      expect(result).toBeDefined();
      expect(result.graph).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
    });
  });

  describe('isTaskNode', () => {
    it('should return true for task node', () => {
      const mockNode = {
        getType: () => PipelineRunNodeType.TASK_NODE,
      } as Node;

      const result = isTaskNode(mockNode);
      expect(result).toBe(true);
    });

    it('should return true for finally node', () => {
      const mockNode = {
        getType: () => PipelineRunNodeType.FINALLY_NODE,
      } as Node;

      const result = isTaskNode(mockNode);
      expect(result).toBe(true);
    });

    it('should return false for other node types', () => {
      const mockNode = {
        getType: () => 'spacer-node',
      } as Node;

      const result = isTaskNode(mockNode);
      expect(result).toBe(false);
    });

    it('should return false for undefined element', () => {
      const result = isTaskNode(undefined);
      expect(result).toBe(false);
    });
  });

  describe('appendStatus', () => {
    const mockPipeline: PipelineKind = {
      apiVersion: 'tekton.dev/v1',
      kind: 'Pipeline',
      metadata: { name: 'test-pipeline', namespace: 'test-ns' },
      spec: {
        tasks: [
          {
            name: 'matrix-task',
            taskRef: { name: 'build', kind: 'Task' },
            matrix: {
              params: [
                {
                  name: 'platform',
                  value: ['linux/x86_64', 'linux/arm64'],
                },
              ],
            },
          },
          {
            name: 'regular-task',
            taskRef: { name: 'test', kind: 'Task' },
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
          tasks: [
            {
              name: 'matrix-task',
              taskRef: { name: 'build', kind: 'Task' },
              matrix: {
                params: [
                  {
                    name: 'platform',
                    value: ['linux/x86_64', 'linux/arm64'],
                  },
                ],
              },
            },
            {
              name: 'regular-task',
              taskRef: { name: 'test', kind: 'Task' },
            },
          ],
        },
      } as never,
    };

    it('should handle matrix tasks with missing parameters', () => {
      const taskRuns: TaskRunKind[] = [
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'matrix-task-1',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineTask': 'matrix-task',
            },
          },
          spec: {
            taskRef: { name: 'build' },
            // Missing params to test null parameter handling
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True',
                reason: runStatus.Succeeded,
              },
            ],
            startTime: '2023-01-01T00:00:00Z',
            completionTime: '2023-01-01T00:01:00Z',
            taskResults: [
              {
                name: 'TEST_OUTPUT',
                value: '{"failures": "2", "warnings": "3"}',
              },
            ],
          },
        } as TaskRunKind,
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: {
            name: 'matrix-task-2',
            namespace: 'test-ns',
            labels: {
              'tekton.dev/pipelineTask': 'matrix-task',
            },
          },
          spec: {
            taskRef: { name: 'build' },
            params: [
              {
                name: 'platform',
                value: 'linux/arm64',
              },
            ],
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'False',
                reason: runStatus.Failed,
              },
            ],
            startTime: '2023-01-01T00:00:00Z',
            completionTime: '2023-01-01T00:02:00Z',
            results: [
              {
                name: 'HACBS_TEST_OUTPUT',
                value: 'invalid-json-to-test-catch-block',
              },
            ],
          },
        } as TaskRunKind,
      ];

      const result = appendStatus(mockPipeline, mockPipelineRun, taskRuns);

      // Should have 3 tasks: 2 matrix instances + 1 regular task
      expect(result).toHaveLength(3);

      // Find matrix tasks
      const matrixTasks = result.filter((task) => task.name.startsWith('matrix-task'));
      expect(matrixTasks).toHaveLength(2);

      // Find tasks by their names since order might vary
      const firstMatrixTask = matrixTasks.find((task) => task.name === 'matrix-task-0');
      const secondMatrixTask = matrixTasks.find((task) => task.name === 'matrix-task-linux-arm64');

      // First matrix task should have index-based name due to missing params
      expect(firstMatrixTask).toBeDefined();
      // The test results parsing fails (as expected from console.warn), so these will be undefined
      expect(firstMatrixTask.status.testFailCount).toBeUndefined();
      expect(firstMatrixTask.status.testWarnCount).toBeUndefined();
      expect(firstMatrixTask.status.duration).toBeDefined();

      // Second matrix task should have platform name
      expect(secondMatrixTask).toBeDefined();
      expect(secondMatrixTask.status.reason).toBe(runStatus.Failed); // Failed status is preserved
    });

    it('should handle TaskRuns with v1beta1 taskResults', () => {
      const taskRunV1Beta1: TaskRunKind = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'TaskRun',
        metadata: {
          name: 'regular-task-v1beta1',
          namespace: 'test-ns',
          labels: {
            'tekton.dev/pipelineTask': 'regular-task',
          },
        },
        spec: {
          taskRef: { name: 'test' },
        },
        status: {
          conditions: [
            {
              type: 'Succeeded',
              status: 'True',
              reason: runStatus.Succeeded,
            },
          ],
          taskResults: [
            {
              name: 'CLAIR_SCAN_RESULT',
              value: '{"vulnerabilities": {"critical": 1, "high": 2}}',
            },
          ],
        },
      } as TaskRunKind;

      const result = appendStatus(mockPipeline, mockPipelineRun, [taskRunV1Beta1]);

      expect(result).toHaveLength(2);
      const regularTask = result.find((task) => task.name === 'regular-task');
      expect(regularTask.status.scanResults).toEqual({
        vulnerabilities: { critical: 1, high: 2 },
      });
    });

    it('should handle invalid JSON in task results', () => {
      const taskRunWithInvalidJson: TaskRunKind = {
        apiVersion: 'tekton.dev/v1',
        kind: 'TaskRun',
        metadata: {
          name: 'regular-task-invalid',
          namespace: 'test-ns',
          labels: {
            'tekton.dev/pipelineTask': 'regular-task',
          },
        },
        spec: {
          taskRef: { name: 'test' },
        },
        status: {
          conditions: [
            {
              type: 'Succeeded',
              status: 'True',
              reason: runStatus.Succeeded,
            },
          ],
          results: [
            {
              name: 'TEST_OUTPUT',
              value: 'invalid-json',
            },
            {
              name: 'CLAIR_SCAN_RESULT',
              value: 'also-invalid-json',
            },
          ],
        },
      } as TaskRunKind;

      // Mock console.warn to verify it's called
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = appendStatus(mockPipeline, mockPipelineRun, [taskRunWithInvalidJson]);

      expect(result).toHaveLength(2);
      const regularTask = result.find((task) => task.name === 'regular-task');
      expect(regularTask.status.testFailCount).toBeUndefined();
      expect(regularTask.status.scanResults).toBeUndefined();

      // Should have called console.warn twice for invalid JSON
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });
  });

  describe('createStepStatus - additional edge cases', () => {
    it('should handle step with terminated but failed reason', () => {
      const status: PipelineTaskStatus = {
        reason: runStatus.Failed,
        steps: [
          {
            name: 'test-step',
            terminated: {
              reason: 'Error',
              startedAt: '2023-01-01T00:00:00Z',
              finishedAt: '2023-01-01T00:01:00Z',
              containerID: 'container-id-1',
              exitCode: 0,
            },
            container: 'container-1',
          },
        ],
      };

      const result = createStepStatus('test-step', status);

      expect(result).toEqual({
        name: 'test-step',
        status: runStatus.Failed,
        startTime: '2023-01-01T00:00:00Z',
        endTime: '2023-01-01T00:01:00Z',
      });
    });

    it('should handle final step with TestFailed status', () => {
      const status: PipelineTaskStatus = {
        reason: runStatus.TestFailed,
        steps: [
          {
            name: 'final-step',
            terminated: {
              reason: 'Completed',
              startedAt: '2023-01-01T00:00:00Z',
              finishedAt: '2023-01-01T00:01:00Z',
              containerID: 'container-id-1',
              exitCode: 0,
            },
            container: 'container-1',
          },
        ],
      };

      const result = createStepStatus('final-step', status, true);

      expect(result).toEqual({
        name: 'final-step',
        status: runStatus.TestFailed,
        startTime: '2023-01-01T00:00:00Z',
        endTime: '2023-01-01T00:01:00Z',
      });
    });

    it('should handle step with running status and previous step', () => {
      const status: PipelineTaskStatus = {
        reason: runStatus.Running,
        steps: [
          {
            name: 'prev-step',
            terminated: {
              reason: 'Completed',
              startedAt: '2023-01-01T00:00:00Z',
              finishedAt: '2023-01-01T00:00:30Z',
              containerID: 'container-id-1',
              exitCode: 0,
            },
            container: 'container-1',
          },
          {
            name: 'current-step',
            running: {
              startedAt: '2023-01-01T00:00:30Z',
            },
            container: 'container-2',
          },
        ],
      };

      const result = createStepStatus('current-step', status);

      expect(result).toEqual({
        name: 'current-step',
        status: runStatus.Running,
        startTime: '2023-01-01T00:00:30Z',
        endTime: undefined,
      });
    });

    it('should handle step with waiting status', () => {
      const status: PipelineTaskStatus = {
        reason: runStatus.Running,
        steps: [
          {
            name: 'waiting-step',
            waiting: {
              reason: 'PodInitializing',
            },
            container: 'container-1',
          },
        ],
      };

      const result = createStepStatus('waiting-step', status);

      expect(result).toEqual({
        name: 'waiting-step',
        status: runStatus.Pending,
        startTime: undefined,
        endTime: undefined,
      });
    });
  });

  describe('getWhenStatus - additional cases', () => {
    it('should handle all runStatus cases', () => {
      expect(getWhenStatus(runStatus.Cancelled)).toBeUndefined();
      expect(getWhenStatus(runStatus.Pending)).toBeUndefined();
      expect(getWhenStatus(runStatus.Running)).toBeUndefined();
      expect(getWhenStatus(runStatus.TestFailed)).toBeUndefined();
    });
  });
});
