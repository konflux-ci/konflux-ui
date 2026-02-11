import { renderHook } from '@testing-library/react';
import { PipelineRunKind } from '../../types';
import {
  useLatestBuildPipelineRunForComponentV2,
  useLatestSuccessfulBuildPipelineRunForComponentV2,
  useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2,
  useLatestPushBuildPipelineRunForComponentV2,
} from '../useLatestPushBuildPipeline';
import { usePipelineRunsV2 } from '../usePipelineRunsV2';

jest.mock('../usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

const mockUsePipelineRunsV2 = usePipelineRunsV2 as jest.Mock;

const mockPipelineRun: PipelineRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  metadata: { name: 'build-1', namespace: 'test-ns', creationTimestamp: '2025-01-01T00:00:00Z' },
  spec: {},
  status: { conditions: [{ type: 'Succeeded', status: 'True' }] },
};

describe('useLatestBuildPipelineRunForComponentV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return first pipeline run and loaded state', () => {
    mockUsePipelineRunsV2.mockReturnValue([[mockPipelineRun], true, undefined]);
    const { result } = renderHook(() =>
      useLatestBuildPipelineRunForComponentV2('test-ns', 'my-component'),
    );
    expect(result.current[0]).toEqual(mockPipelineRun);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeUndefined();
  });

  it('should return undefined when no pipeline runs', () => {
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);
    const { result } = renderHook(() =>
      useLatestBuildPipelineRunForComponentV2('test-ns', 'my-component'),
    );
    expect(result.current[0]).toBeUndefined();
    expect(result.current[1]).toBe(true);
  });
});

describe('useLatestSuccessfulBuildPipelineRunForComponentV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return latest successful pipeline and call getNextPage when no success yet', () => {
    const getNextPage = jest.fn();
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined, getNextPage, {}]);
    const { result } = renderHook(() =>
      useLatestSuccessfulBuildPipelineRunForComponentV2('test-ns', 'my-component'),
    );
    expect(result.current[0]).toBeUndefined();
    expect(result.current[1]).toBe(true);
    expect(getNextPage).toHaveBeenCalled();
  });

  it('should return successful pipeline when found', () => {
    mockUsePipelineRunsV2.mockReturnValue([[mockPipelineRun], true, undefined, jest.fn(), {}]);
    const { result } = renderHook(() =>
      useLatestSuccessfulBuildPipelineRunForComponentV2('test-ns', 'my-component'),
    );
    expect(result.current[0]).toEqual(mockPipelineRun);
    expect(result.current[1]).toBe(true);
  });
});

describe('useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass filterByTargetBranch when branchName is provided', () => {
    mockUsePipelineRunsV2.mockReturnValue([[mockPipelineRun], true, undefined, jest.fn(), {}]);
    renderHook(() =>
      useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2('test-ns', 'my-component', 'main'),
    );
    expect(mockUsePipelineRunsV2).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.any(Object),
          filterByTargetBranch: 'main',
        }),
      }),
    );
  });

  it('should not pass filterByTargetBranch when branchName is undefined', () => {
    mockUsePipelineRunsV2.mockReturnValue([[mockPipelineRun], true, undefined, jest.fn(), {}]);
    renderHook(() =>
      useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2(
        'test-ns',
        'my-component',
        undefined,
      ),
    );
    const call = mockUsePipelineRunsV2.mock.calls[0][1];
    expect(call.selector).not.toHaveProperty('filterByTargetBranch');
  });

  it('should return latest successful pipeline for branch', () => {
    mockUsePipelineRunsV2.mockReturnValue([[mockPipelineRun], true, undefined, jest.fn(), {}]);
    const { result } = renderHook(() =>
      useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2('test-ns', 'my-component', 'main'),
    );
    expect(result.current[0]).toEqual(mockPipelineRun);
    expect(result.current[1]).toBe(true);
  });
});

describe('useLatestPushBuildPipelineRunForComponentV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return first pipeline run with push event type selector', () => {
    mockUsePipelineRunsV2.mockReturnValue([[mockPipelineRun], true, undefined, jest.fn(), {}]);
    const { result } = renderHook(() =>
      useLatestPushBuildPipelineRunForComponentV2('test-ns', 'my-component'),
    );
    expect(result.current[0]).toEqual(mockPipelineRun);
    expect(result.current[1]).toBe(true);
    expect(mockUsePipelineRunsV2).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            'pipelines.appstudio.openshift.io/type': 'build',
            'appstudio.openshift.io/component': 'my-component',
          }),
        }),
        limit: 1,
      }),
    );
  });
});
