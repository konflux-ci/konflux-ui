import { renderHook } from '@testing-library/react-hooks';
import { testTaskRuns } from '../../components/TaskRunListView/__data__/mock-TaskRun-data';
import { useTaskRuns, useTaskRunsForPipelineRuns } from '../useTaskRuns';
import { useTaskRunsV2 } from '../useTaskRunsV2';

jest.mock('../useTaskRunsV2');
jest.mock('../usePipelineRuns', () => ({
  useTaskRuns: jest.fn(),
}));

const useTaskRunsV2Mock = useTaskRunsV2 as jest.Mock;
const usePipelineRunsTaskRunsMock = jest.requireMock('../usePipelineRuns').useTaskRuns;

describe('useTaskRuns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return sorted taskruns', () => {
    usePipelineRunsTaskRunsMock.mockReturnValue([testTaskRuns, true, undefined]);
    const { result } = renderHook(() => useTaskRuns('test-ns', 'test-pipelinerun', 'test-task'));

    const [taskRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    // Both TaskRuns have identical completion times, so sorted alphabetically by name
    expect(taskRuns.map((tr) => tr.metadata?.name)).toEqual(['example', 'example-234']);
  });

  it('should sort the taskruns based on the completionTime', () => {
    const taskRuns = [
      testTaskRuns[0],
      {
        ...testTaskRuns[1],
        metadata: {
          ...testTaskRuns[1].metadata,
          name: 'example-task-running',
        },
        status: {
          ...testTaskRuns[1].status,
          completionTime: undefined,
        },
      },
    ];

    usePipelineRunsTaskRunsMock.mockReturnValue([taskRuns, true, undefined]);
    const { result } = renderHook(() => useTaskRuns('test-ns', 'test-pipelinerun', 'test-task'));

    const [tRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(tRuns.map((tr) => tr.metadata?.name)).toEqual(['example', 'example-task-running']);
  });

  it('returns empty array if results are not fetched', () => {
    usePipelineRunsTaskRunsMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() => useTaskRuns('test-ns', 'test'));

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should pass options to useTaskRunsV2', () => {
    const options = { enabled: false, limit: 10 };
    useTaskRunsV2Mock.mockReturnValue([[], false, undefined]);

    renderHook(() => useTaskRunsForPipelineRuns('test-ns', 'test-pipelinerun', undefined, options));

    expect(useTaskRunsV2Mock).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        enabled: false,
        limit: 10,
      }),
    );
  });
});
