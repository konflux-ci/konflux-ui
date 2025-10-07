import { renderHook } from '@testing-library/react-hooks';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { DataState, testPipelineRuns } from '../../__data__/pipelinerun-data';
import { createK8sWatchResourceMock, createUseApplicationMock } from '../../utils/test-utils';
import { useLatestBuildPipelines } from '../useLatestBuildPipelines';
import { useTRPipelineRuns } from '../useTektonResults';

jest.mock('../useTektonResults');
jest.mock('~/kubearchive/hooks');
jest.mock('~/kubearchive/conditional-checks', () => ({
  createConditionsHook: jest.fn(() => jest.fn()),
  ensureConditionIsOn: jest.fn(() => jest.fn()),
}));
jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseKubearchiveListResourceQuery = useKubearchiveListResourceQuery as jest.Mock;

const componentNames = ['devfile-sample-node'];
const componentNames2 = ['devfile-sample-node', 'devfile-sample-node-2'];

describe('useLatestBuildPipelines', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseKubearchiveListResourceQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: undefined,
      isFetchingNextPage: false,
    });
  });

  it('should return empty array', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() =>
      useLatestBuildPipelines('test-ns', 'test-pipelinerun', componentNames),
    );

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return build pipelines', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [testPipelineRuns[DataState.RUNNING]],
      true,
      undefined,
    ]);
    useTRPipelineRunsMock.mockReturnValue([[], true, undefined, undefined]);
    const { result } = renderHook(() =>
      useLatestBuildPipelines('test-ns', 'test-pipelinerun', componentNames),
    );

    const [pipelineRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(pipelineRuns.map((tr) => tr.metadata?.name)).toEqual(['test-caseqfvdj']);
  });

  it('should get more build pipelines when necessary', () => {
    const getNextPageMock = jest.fn();
    useK8sWatchResourceMock.mockReturnValue([
      [testPipelineRuns[DataState.RUNNING]],
      true,
      undefined,
    ]);
    useTRPipelineRunsMock.mockReturnValue([[], true, undefined, getNextPageMock]);
    const { result } = renderHook(() =>
      useLatestBuildPipelines('test-ns', 'test-pipelinerun', componentNames2),
    );

    const [pipelineRuns, loaded] = result.current;
    expect(loaded).toBe(false);
    expect(pipelineRuns.map((tr) => tr.metadata?.name)).toEqual(['test-caseqfvdj']);
    expect(getNextPageMock).toHaveBeenCalled();
  });
});
