import { renderHook } from '@testing-library/react';
import { PUSH_BUILD_EVENT_TYPES, PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import {
  useLatestBuildPipelineRunForComponentV2,
  useLatestPushBuildPipelineRunForComponentV2,
  useLatestSuccessfulBuildPipelineRunForComponentV2,
} from '../useLatestPushBuildPipeline';
import { usePipelineRunsV2 } from '../usePipelineRunsV2';

jest.mock('../usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

const createPipelineRun = (name: string, status: 'True' | 'False'): PipelineRunKind =>
  ({
    metadata: { name, uid: name, creationTimestamp: '2026-08-20T00:00:00Z' },
    status: {
      conditions: [{ type: 'Succeeded', status }],
    },
  }) as unknown as PipelineRunKind;

describe('component build pipeline hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select the latest build for the requested component version', () => {
    const pipelineRun = createPipelineRun('component-main-build', 'True');
    usePipelineRunsV2Mock.mockReturnValue([[pipelineRun], true, undefined, undefined, undefined]);

    const { result } = renderHook(() =>
      useLatestBuildPipelineRunForComponentV2('test-ns', 'component', 'main'),
    );

    expect(result.current).toEqual([pipelineRun, true, undefined]);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith('test-ns', {
      selector: {
        matchLabels: {
          [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
          [PipelineRunLabel.COMPONENT]: 'component',
          [PipelineRunLabel.COMPONENT_VERSION]: 'main',
        },
      },
      limit: 1,
    });
  });

  it('should omit the version selector when no version is provided', () => {
    usePipelineRunsV2Mock.mockReturnValue([[], true, undefined, undefined, undefined]);

    renderHook(() => useLatestBuildPipelineRunForComponentV2('test-ns', 'component'));

    const options = usePipelineRunsV2Mock.mock.calls[0][1];
    expect(options.selector.matchLabels).toEqual({
      [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
      [PipelineRunLabel.COMPONENT]: 'component',
    });
  });

  it('should return the first successful build for a component version', () => {
    const failedRun = createPipelineRun('failed-build', 'False');
    const successfulRun = createPipelineRun('successful-build', 'True');
    const getNextPage = jest.fn();
    usePipelineRunsV2Mock.mockReturnValue([
      [failedRun, successfulRun],
      true,
      undefined,
      getNextPage,
      undefined,
    ]);

    const { result } = renderHook(() =>
      useLatestSuccessfulBuildPipelineRunForComponentV2('test-ns', 'component', 'main'),
    );

    expect(result.current).toEqual([successfulRun, true, undefined]);
    expect(getNextPage).not.toHaveBeenCalled();
    expect(usePipelineRunsV2Mock.mock.calls[0][1]).toEqual({
      selector: {
        matchLabels: {
          [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
          [PipelineRunLabel.COMPONENT]: 'component',
          [PipelineRunLabel.COMPONENT_VERSION]: 'main',
        },
      },
    });
  });

  it('should request another page when no successful build has been found', () => {
    const getNextPage = jest.fn();
    usePipelineRunsV2Mock.mockReturnValue([
      [createPipelineRun('failed-build', 'False')],
      true,
      undefined,
      getNextPage,
      undefined,
    ]);

    renderHook(() => useLatestSuccessfulBuildPipelineRunForComponentV2('test-ns', 'component'));

    expect(getNextPage).toHaveBeenCalledTimes(1);
  });

  it('should select only push-triggered builds and preserve the version selector', () => {
    const pipelineRun = createPipelineRun('component-release-build', 'True');
    usePipelineRunsV2Mock.mockReturnValue([[pipelineRun], true, undefined, undefined, undefined]);

    const { result } = renderHook(() =>
      useLatestPushBuildPipelineRunForComponentV2('test-ns', 'component', 'release'),
    );

    expect(result.current).toEqual([pipelineRun, true, undefined]);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith('test-ns', {
      selector: {
        matchLabels: {
          [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
          [PipelineRunLabel.COMPONENT]: 'component',
          [PipelineRunLabel.COMPONENT_VERSION]: 'release',
        },
        matchExpressions: [
          {
            key: PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL,
            operator: 'In',
            values: PUSH_BUILD_EVENT_TYPES,
          },
        ],
      },
      limit: 1,
    });
  });
});
