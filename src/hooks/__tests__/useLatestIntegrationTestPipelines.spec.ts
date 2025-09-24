import { renderHook } from '@testing-library/react-hooks';
import { DataState, testPipelineRuns } from '../../__data__/pipelinerun-data';
import { PipelineRunLabel, PipelineRunType } from '../../consts/pipelinerun';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { useLatestIntegrationTestPipelines } from '../useLatestIntegrationTestPipelines';
import { usePipelineRunsV2 } from '../usePipelineRunsV2';

jest.mock('../usePipelineRunsV2');
const useK8sWatchResourceMock = createK8sWatchResourceMock();
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

const testNames = ['test-caseqfvdj'];
const testNames2 = ['test-caseqfvdj', 'test'];

describe('useLatestIntegrationTestPipelines', () => {
  it('should return empty array', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() =>
      useLatestIntegrationTestPipelines('test-ns', 'test-pipelinerun', testNames),
    );

    expect(result.current).toEqual([
      [],
      false,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
  });

  it('should return test pipelines', () => {
    let pipelineType: string;
    useK8sWatchResourceMock.mockImplementation((watchOptions) => {
      if (!watchOptions) {
        return [[], false];
      }
      if (watchOptions.groupVersionKind.kind === 'Component') {
        return [[], true];
      }
      return [[], true, undefined];
    });
    usePipelineRunsV2Mock.mockImplementation((_namespace, options) => {
      if (options?.selector?.matchLabels) {
        pipelineType = options.selector.matchLabels[PipelineRunLabel.PIPELINE_TYPE];
      }
      return [
        [testPipelineRuns[DataState.RUNNING]],
        true,
        undefined,
        undefined,
        { isFetchingNextPage: false, hasNextPage: false },
      ];
    });
    const { result } = renderHook(() =>
      useLatestIntegrationTestPipelines('test-ns', 'test-pipelinerun', testNames),
    );

    const [pipelineRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(pipelineRuns.map((tr) => tr.metadata?.name)).toEqual(['test-caseqfvdj']);
    expect(pipelineType).toEqual(PipelineRunType.TEST);
  });

  it('should get additional data when there are more tekton results.', () => {
    const getNextPageMock = jest.fn();
    useK8sWatchResourceMock.mockReturnValue([
      [testPipelineRuns[DataState.RUNNING]],
      true,
      undefined,
    ]);
    usePipelineRunsV2Mock.mockReturnValue([
      [testPipelineRuns[DataState.RUNNING]],
      true,
      undefined,
      getNextPageMock,
      { isFetchingNextPage: false, hasNextPage: true },
    ]);

    renderHook(() => useLatestIntegrationTestPipelines('test-ns', 'test-pipelinerun', testNames2));
    expect(getNextPageMock).toHaveBeenCalled();
  });
});
