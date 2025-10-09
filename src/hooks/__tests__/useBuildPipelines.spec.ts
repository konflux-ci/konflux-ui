import { renderHook } from '@testing-library/react-hooks';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { DataState, testPipelineRuns } from '../../__data__/pipelinerun-data';
import { createK8sWatchResourceMock, createUseApplicationMock } from '../../utils/test-utils';
import { useBuildPipelines } from '../useBuildPipelines';
import { usePipelineRunsV2 } from '../usePipelineRunsV2';

jest.mock('../usePipelineRunsV2', () => ({
  ...jest.requireActual('../usePipelineRunsV2'),
  usePipelineRunsV2: jest.fn(),
}));
jest.mock('~/kubearchive/hooks', () => ({
  ...jest.requireActual('~/kubearchive/hooks'),
  useKubearchiveListResourceQuery: jest.fn(),
}));
jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useK8sWatchResourceMock = createK8sWatchResourceMock();
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseKubearchiveListResourceQuery = useKubearchiveListResourceQuery as jest.Mock;

describe('useBuildPipelines', () => {
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
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    const { result } = renderHook(() => useBuildPipelines('test-ns', 'test-pipelinerun', null));

    expect(result.current).toEqual([
      [],
      true,
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
    usePipelineRunsV2Mock.mockReturnValue([
      [testPipelineRuns[DataState.RUNNING]],
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
    useK8sWatchResourceMock.mockReturnValue([
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
    ]);

    usePipelineRunsV2Mock.mockReturnValue([
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
