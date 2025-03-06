import { renderHook } from '@testing-library/react-hooks';
import { DataState, testPipelineRuns } from '../../__data__/pipelinerun-data';
import { PipelineRunLabel, PipelineRunType } from '../../consts/pipelinerun';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { useLatestIntegrationTestPipelines } from '../useLatestIntegrationTestPipelines';
import { useTRPipelineRuns } from '../useTektonResults';

jest.mock('../useTektonResults');
const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;

const testNames = ['test-caseqfvdj'];
const testNames2 = ['test-caseqfvdj', 'test'];

describe('useLatestIntegrationTestPipelines', () => {
  it('should return empty array', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() =>
      useLatestIntegrationTestPipelines('test-ns', 'test-pipelinerun', testNames),
    );

    expect(result.current).toEqual([[], false, undefined]);
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
      pipelineType = watchOptions.selector.matchLabels[PipelineRunLabel.PIPELINE_TYPE];
      return [[testPipelineRuns[DataState.RUNNING]], true, undefined];
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
    useTRPipelineRunsMock.mockReturnValue([[], true, undefined, getNextPageMock]);

    renderHook(() => useLatestIntegrationTestPipelines('test-ns', 'test-ws', testNames2));
    expect(getNextPageMock).toHaveBeenCalled();
  });
});
