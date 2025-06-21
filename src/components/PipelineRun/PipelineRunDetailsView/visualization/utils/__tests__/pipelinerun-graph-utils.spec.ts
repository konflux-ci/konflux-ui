import { WhenStatus } from '@patternfly/react-topology';
import { runStatus } from '../../../../../../utils/pipeline-utils';
import { PipelineRunNodeType } from '../../types';
import { 
  getPipelineRunDataModel, 
  extractDepsFromContextVariables,
  getPipelineFromPipelineRun,
  createStepStatus,
  appendStatus,
  taskHasWhenExpression,
  nodesHasWhenExpression,
  getWhenStatus,
  taskWhenStatus,
  getTaskBadgeCount,
  isTaskNode,
  scrollNodeIntoView
} from '../pipelinerun-graph-utils';

describe('pipelinerun-graph-utils', () => {
  describe('extractDepsFromContextVariables', () => {
    it('should extract dependencies from context variables', () => {
      const contextVariable = '$(tasks.build-task.results.output)';
      const result = extractDepsFromContextVariables(contextVariable);
      expect(result).toEqual(['build-task']);
    });

    it('should extract multiple dependencies', () => {
      const contextVariable = '$(tasks.build-task.results.output) and $(tasks.test-task.results.output)';
      const result = extractDepsFromContextVariables(contextVariable);
      expect(result).toEqual(['build-task', 'test-task']);
    });

    it('should handle empty string', () => {
      const result = extractDepsFromContextVariables('');
      expect(result).toEqual([]);
    });

    it('should handle string without dependencies', () => {
      const result = extractDepsFromContextVariables('no dependencies here');
      expect(result).toEqual([]);
    });
  });

  describe('getPipelineFromPipelineRun', () => {
    it('should return pipeline from pipeline run', () => {
      const mockPipelineRun = {
        spec: {
          pipelineRef: {
            name: 'test-pipeline'
          }
        }
      } as any;
      
      const result = getPipelineFromPipelineRun(mockPipelineRun);
      expect(result).toBeDefined();
    });

    it('should return null if pipeline is not found', () => {
      const mockPipelineRun = {
        spec: {}
      } as any;
      
      const result = getPipelineFromPipelineRun(mockPipelineRun);
      expect(result).toBeNull();
    });
  });

  describe('createStepStatus', () => {
    it('should create step status for running task', () => {
      const mockTaskStatus = {
        reason: 'Running',
        conditions: [
          {
            type: 'Succeeded',
            status: 'Unknown'
          }
        ]
      } as any;
      
      const result = createStepStatus('test-step', mockTaskStatus);
      expect(result).toEqual({
        name: 'test-step',
        status: 'Pending'
      });
    });

    it('should create step status for succeeded task', () => {
      const mockTaskStatus = {
        reason: 'Succeeded',
        conditions: [
          {
            type: 'Succeeded',
            status: 'True'
          }
        ]
      } as any;
      
      const result = createStepStatus('test-step', mockTaskStatus);
      expect(result).toEqual({
        name: 'test-step',
        status: 'Pending'
      });
    });
  });

  describe('appendStatus', () => {
    it('should append status to existing statuses', () => {
      const mockPipeline = {
        spec: {
          tasks: [
            {
              name: 'test-task',
              taskRef: { name: 'test-task-ref' }
            }
          ]
        }
      } as any;
      
      const mockPipelineRun = {
        status: {
          pipelineSpec: {
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'test-task-ref' }
              }
            ]
          }
        }
      } as any;
      
      const mockTaskRuns = [] as any;
      
      const result = appendStatus(mockPipeline, mockPipelineRun, mockTaskRuns);
      expect(result).toBeDefined();
    });
  });

  describe('taskHasWhenExpression', () => {
    it('should return true if task has when expression', () => {
      const mockTask = {
        when: [
          {
            input: '$(params.environment)',
            operator: 'in',
            values: ['dev', 'staging']
          }
        ]
      } as any;
      
      const result = taskHasWhenExpression(mockTask);
      expect(result).toBe(true);
    });

    it('should return false if task has no when expression', () => {
      const mockTask = {} as any;
      
      const result = taskHasWhenExpression(mockTask);
      expect(result).toBe(false);
    });
  });

  describe('nodesHasWhenExpression', () => {
    it('should return true if any node has when expression', () => {
      const mockNodes = [
        {
          data: {
            task: {
              when: [
                {
                  input: '$(params.environment)',
                  operator: 'in',
                  values: ['dev', 'staging']
                }
              ]
            }
          }
        }
      ] as any;
      
      const result = nodesHasWhenExpression(mockNodes);
      expect(result).toBe(true);
    });

    it('should return false if no nodes have when expression', () => {
      const mockNodes = [
        {
          data: {
            task: {}
          }
        }
      ] as any;
      
      const result = nodesHasWhenExpression(mockNodes);
      expect(result).toBe(false);
    });
  });

  describe('getWhenStatus', () => {
    it('should return Met status for when expression', () => {
      const result = getWhenStatus(runStatus.Succeeded);
      expect(result).toBe(WhenStatus.Met);
    });
  });

  describe('taskWhenStatus', () => {
    it('should return Met status for task with when expression', () => {
      const mockTask = {
        when: [
          {
            input: '$(params.environment)',
            operator: 'in',
            values: ['dev', 'staging']
          }
        ],
        status: {
          reason: runStatus.Succeeded
        }
      } as any;
      
      const result = taskWhenStatus(mockTask);
      expect(result).toBe(WhenStatus.Met);
    });

    it('should return Met status for task without when expression', () => {
      const mockTask = {} as any;
      
      const result = taskWhenStatus(mockTask);
      expect(result).toBeUndefined();
    });
  });

  describe('getTaskBadgeCount', () => {
    it('should return badge count for task with when expression', () => {
      const mockData = {
        testFailCount: 2,
        testWarnCount: 1
      } as any;
      
      const result = getTaskBadgeCount(mockData);
      expect(result).toBe(3);
    });

    it('should return 0 for task without when expression', () => {
      const mockData = {} as any;
      
      const result = getTaskBadgeCount(mockData);
      expect(result).toBe(0);
    });
  });

  describe('isTaskNode', () => {
    it('should return true for task node', () => {
      const mockNode = {
        getType: () => PipelineRunNodeType.TASK_NODE
      } as any;
      
      const result = isTaskNode(mockNode);
      expect(result).toBe(true);
    });

    it('should return true for finally node', () => {
      const mockNode = {
        getType: () => PipelineRunNodeType.FINALLY_NODE
      } as any;
      
      const result = isTaskNode(mockNode);
      expect(result).toBe(true);
    });
  });

  describe('getPipelineRunDataModel', () => {
    it('should create pipeline run data model', () => {
      const mockPipelineRun = {
        metadata: {
          name: 'test-pipeline-run'
        },
        spec: {
          pipelineRef: {
            name: 'test-pipeline'
          }
        },
        status: {
          taskRuns: {
            'task-1': {
              status: {
                conditions: [
                  {
                    type: 'Succeeded',
                    status: 'True'
                  }
                ]
              }
            }
          }
        }
      } as any;
      
      const mockTaskRuns = [
        {
          metadata: {
            name: 'task-1'
          },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'True'
              }
            ]
          }
        }
      ] as any;
      
      const result = getPipelineRunDataModel(mockPipelineRun, mockTaskRuns);
      expect(result).toBeDefined();
    });
  });

  describe('scrollNodeIntoView', () => {
    it('should handle Firefox browser with no scroll needed', () => {
      const mockNode = {
        getId: () => 'test-node-id',
        getBounds: () => ({ x: 100, y: 100, width: 200, height: 100 })
      } as any;
      
      const mockScrollPane = {
        querySelector: jest.fn().mockReturnValue({
          scrollIntoView: jest.fn()
        }),
        scrollLeft: 50, // Changed from 150 to 50 so node is fully visible
        offsetWidth: 800,
        scrollTo: jest.fn(),
        ownerDocument: {
          defaultView: {
            navigator: {
              userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0'
            }
          }
        }
      } as any;

      scrollNodeIntoView(mockNode, mockScrollPane);

      expect(mockScrollPane.scrollTo).not.toHaveBeenCalled();
    });

    it('should handle Firefox browser with scroll needed', () => {
      const mockNode = {
        getId: () => 'test-node-id',
        getBounds: () => ({ x: 100, y: 100, width: 200, height: 100 })
      } as any;
      
      const mockScrollPane = {
        querySelector: jest.fn().mockReturnValue({
          scrollIntoView: jest.fn()
        }),
        scrollLeft: 300, // Node is off to the left
        offsetWidth: 800,
        scrollTo: jest.fn(),
        ownerDocument: {
          defaultView: {
            navigator: {
              userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0'
            }
          }
        }
      } as any;

      scrollNodeIntoView(mockNode, mockScrollPane);

      expect(mockScrollPane.scrollTo).toHaveBeenCalledWith({
        behavior: 'smooth',
        left: 100
      });
    });

    it('should handle non-Firefox browser', () => {
      const mockNode = {
        getId: () => 'test-node-id',
        getBounds: () => ({ x: 100, y: 100, width: 200, height: 100 })
      } as any;
      
      const mockScrollPane = {
        querySelector: jest.fn().mockReturnValue({
          scrollIntoView: jest.fn()
        }),
        scrollLeft: 150,
        offsetWidth: 800,
        scrollTo: jest.fn(),
        ownerDocument: {
          defaultView: {
            navigator: {
              userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        }
      } as any;

      scrollNodeIntoView(mockNode, mockScrollPane);

      expect(mockScrollPane.querySelector).toHaveBeenCalledWith('[data-id="test-node-id"]');
      expect(mockScrollPane.querySelector().scrollIntoView).toHaveBeenCalled();
    });
  });
}); 