import { renderHook } from '@testing-library/react-hooks';
import { testTaskRuns } from '../../components/TaskRunListView/__data__/mock-TaskRun-data';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { useTaskRuns } from '../useTaskRuns';
import { useTRTaskRuns } from '../useTektonResults';

jest.mock('../useTektonResults');

const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useTRTaskRunsMock = useTRTaskRuns as jest.Mock;

describe('useTaskRuns', () => {
  it('should return sorted taskruns', () => {
    useK8sWatchResourceMock.mockReturnValue([testTaskRuns, true, undefined]);
    const { result } = renderHook(() => useTaskRuns('test-ns', 'test-pipelinerun', 'test-task'));

    const [taskRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(taskRuns.map((tr) => tr.metadata?.name)).toEqual(['example-234', 'example']);
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

    useK8sWatchResourceMock.mockReturnValue([taskRuns, true, undefined]);
    const { result } = renderHook(() => useTaskRuns('test-ns', 'test-pipelinerun', 'test-task'));

    const [tRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(tRuns.map((tr) => tr.metadata?.name)).toEqual(['example', 'example-task-running']);
  });

  it('returns undefined if results are not fetched', () => {
    useK8sWatchResourceMock.mockReturnValue([null, false, undefined]);
    useTRTaskRunsMock.mockReturnValue([null, false, undefined]);
    const { result } = renderHook(() => useTaskRuns('test-ns', 'test'));

    expect(result.current).toEqual([[], false, undefined]);
  });
});
