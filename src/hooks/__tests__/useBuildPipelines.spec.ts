import { renderHook } from '@testing-library/react-hooks';
import { DataState, testPipelineRuns } from '../../__data__/pipelinerun-data';
import { createK8sWatchResourceMock, createUseApplicationMock } from '../../utils/test-utils';
import { useBuildPipelines } from '../useBuildPipelines';
import { useTRPipelineRuns } from '../useTektonResults';

jest.mock('../useTektonResults');

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;

describe('useBuildPipelines', () => {
  it('should return empty array', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    useTRPipelineRunsMock.mockReturnValue([
      [],
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => useBuildPipelines('test-ns', 'test-pipelinerun', null));

    expect(result.current).toEqual([
      [],
      false,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
  });

  it('should return build pipelines', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [testPipelineRuns[DataState.RUNNING]],
      true,
      undefined,
    ]);
    useTRPipelineRunsMock.mockReturnValue([
      [],
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => useBuildPipelines('test-ns', 'test-pipelinerun', null));

    const [pipelineRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(pipelineRuns.map((tr) => tr.metadata?.name)).toEqual(['test-caseqfvdj']);
  });

  it('should filter build pipelines by component name when includeComponents is true', () => {
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);

    useTRPipelineRunsMock.mockReturnValue([
      [
        {
          kind: 'PipelineRun',
          metadata: {
            name: 'pipeline-a',
            labels: {
              'appstudio.openshift.io/component': 'component-a',
              'appstudio.openshift.io/application': 'test',
              'pipelinesascode.tekton.dev/event-type': 'push',
            },
          },
        },
        {
          kind: 'PipelineRun',
          metadata: {
            name: 'pipeline-b',
            labels: {
              'appstudio.openshift.io/component': 'component-b',
              'appstudio.openshift.io/application': 'test',
              'pipelinesascode.tekton.dev/event-type': 'push',
            },
          },
        },
      ],
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    const { result } = renderHook(() =>
      useBuildPipelines(
        'test-ns',
        'test',
        undefined,
        true,
        ['component-b'], // should only match pipeline-b
      ),
    );

    const [pipelineRuns, loaded] = result.current;

    expect(loaded).toBe(true);
    expect(pipelineRuns).toHaveLength(1);
    expect(pipelineRuns[0].metadata?.name).toBe('pipeline-b');
  });
});
