import { renderHook } from '@testing-library/react-hooks';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { DataState, testPipelineRuns } from '../../__data__/pipelinerun-data';
import { createK8sWatchResourceMock, createUseApplicationMock } from '../../utils/test-utils';
import { useLatestPushBuildPipelines } from '../useLatestPushBuildPipelines';
import { useTRPipelineRuns } from '../useTektonResults';

jest.mock('../useTektonResults');
jest.mock('~/kubearchive/hooks');
jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: jest.fn(),
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseKubearchiveListResourceQuery = useKubearchiveListResourceQuery as jest.Mock;

const componentNames = ['devfile-sample-node'];
const componentNames2 = ['devfile-sample-node', 'devfile-sample-node-2'];

describe('useLatestPushBuildPipelines', () => {
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
      useLatestPushBuildPipelines('test-ns', 'test-pipelinerun', componentNames),
    );

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return build pipelines', () => {
    const mockPushPipelineRun = {
      ...testPipelineRuns[DataState.RUNNING],
      metadata: {
        ...testPipelineRuns[DataState.RUNNING]?.metadata,
        labels: {
          ...testPipelineRuns[DataState.RUNNING]?.metadata?.labels,
          'pipelinesascode.tekton.dev/event-type': 'push',
        },
      },
    };
    useK8sWatchResourceMock.mockReturnValue([[mockPushPipelineRun], true, undefined]);
    useTRPipelineRunsMock.mockReturnValue([[], true, undefined, undefined]);
    const { result } = renderHook(() =>
      useLatestPushBuildPipelines('test-ns', 'test-pipelinerun', componentNames),
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
      useLatestPushBuildPipelines('test-ns', 'test-pipelinerun', componentNames2),
    );

    const [pipelineRuns, loaded] = result.current;
    expect(loaded).toBe(false);
    expect(pipelineRuns.map((tr) => tr.metadata?.name)).toEqual(['test-caseqfvdj']);
    expect(getNextPageMock).toHaveBeenCalled();
  });

  it('should return build pipelines triggered by incoming webhook', () => {
    const mockIncomingPipelineRun = {
      ...testPipelineRuns[DataState.SUCCEEDED],
      metadata: {
        ...testPipelineRuns[DataState.SUCCEEDED]?.metadata,
        labels: {
          ...testPipelineRuns[DataState.SUCCEEDED]?.metadata?.labels,
          'pipelinesascode.tekton.dev/event-type': 'incoming',
        },
      },
    };
    useK8sWatchResourceMock.mockReturnValue([[mockIncomingPipelineRun], true, undefined]);
    useTRPipelineRunsMock.mockReturnValue([[], true, undefined, undefined]);
    const { result } = renderHook(() =>
      useLatestPushBuildPipelines('test-ns', 'test-pipelinerun', componentNames),
    );
    const [pipelineRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(pipelineRuns.map((tr) => tr.metadata?.name)).toEqual(['test-caseqfvdj']);
  });

  it('should prefer the latest push or incoming build when both exist', () => {
    const mockPushPipelineRun = {
      ...testPipelineRuns[DataState.FAILED],
      metadata: {
        ...testPipelineRuns[DataState.FAILED]?.metadata,
        name: 'older-push-build',
        creationTimestamp: '2024-01-01T10:00:00Z',
        labels: {
          ...testPipelineRuns[DataState.FAILED]?.metadata?.labels,
          'pipelinesascode.tekton.dev/event-type': 'push',
        },
      },
      status: {
        ...testPipelineRuns[DataState.FAILED]?.status,
        completionTime: '2024-01-01T10:00:00Z',
      },
    };
    const mockIncomingPipelineRun = {
      ...testPipelineRuns[DataState.SUCCEEDED],
      metadata: {
        ...testPipelineRuns[DataState.SUCCEEDED]?.metadata,
        name: 'newer-incoming-build',
        creationTimestamp: '2024-01-01T11:00:00Z',
        labels: {
          ...testPipelineRuns[DataState.SUCCEEDED]?.metadata?.labels,
          'pipelinesascode.tekton.dev/event-type': 'incoming',
        },
      },
      status: {
        ...testPipelineRuns[DataState.SUCCEEDED]?.status,
        completionTime: '2024-01-01T11:00:00Z',
      },
    };
    useK8sWatchResourceMock.mockReturnValue([
      [mockPushPipelineRun, mockIncomingPipelineRun],
      true,
      undefined,
    ]);
    useTRPipelineRunsMock.mockReturnValue([[], true, undefined, undefined]);
    const { result } = renderHook(() =>
      useLatestPushBuildPipelines('test-ns', 'test-pipelinerun', componentNames),
    );
    const [pipelineRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(pipelineRuns.map((tr) => tr.metadata?.name)).toEqual(['newer-incoming-build']);
  });

  it('should return build pipelines triggered by gitlab Push event', () => {
    const mockGitlabPushPipelineRun = {
      ...testPipelineRuns[DataState.SUCCEEDED],
      metadata: {
        ...testPipelineRuns[DataState.SUCCEEDED]?.metadata,
        labels: {
          ...testPipelineRuns[DataState.SUCCEEDED]?.metadata?.labels,
          'pipelinesascode.tekton.dev/event-type': 'Push',
        },
      },
    };
    useK8sWatchResourceMock.mockReturnValue([[mockGitlabPushPipelineRun], true, undefined]);
    useTRPipelineRunsMock.mockReturnValue([[], true, undefined, undefined]);
    const { result } = renderHook(() =>
      useLatestPushBuildPipelines('test-ns', 'test-pipelinerun', componentNames),
    );
    const [pipelineRuns, loaded] = result.current;
    expect(loaded).toBe(true);
    expect(pipelineRuns.map((tr) => tr.metadata?.name)).toEqual(['test-caseqfvdj']);
  });
});
