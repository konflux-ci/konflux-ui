import { renderHook } from '@testing-library/react';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { useComponentBranches } from '../useComponentBranches';
import { usePipelineRunsV2 } from '../usePipelineRunsV2';

jest.mock('../usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

const mockUsePipelineRunsV2 = usePipelineRunsV2 as jest.Mock;

describe('useComponentBranches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty branches when namespace or componentName is null/undefined', () => {
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);
    const { result } = renderHook(() => useComponentBranches(null, undefined));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(true);
    expect(mockUsePipelineRunsV2).toHaveBeenCalledWith(null, undefined);
  });

  it('should return empty array when not loaded', () => {
    mockUsePipelineRunsV2.mockReturnValue([undefined, false, undefined]);
    const { result } = renderHook(() => useComponentBranches('test-ns', 'my-component'));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(false);
  });

  it('should return error when usePipelineRunsV2 returns error', () => {
    const err = new Error('Failed');
    mockUsePipelineRunsV2.mockReturnValue([[], true, err]);
    const { result } = renderHook(() => useComponentBranches('test-ns', 'my-component'));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBe(err);
  });

  it('should extract and sort unique branch names from pipeline run annotations', () => {
    const plr1 = {
      metadata: {
        name: 'run-1',
        annotations: { [PipelineRunLabel.COMMIT_BRANCH_ANNOTATION]: 'main' },
      },
    };
    const plr2 = {
      metadata: {
        name: 'run-2',
        annotations: { [PipelineRunLabel.COMMIT_BRANCH_ANNOTATION]: 'develop' },
      },
    };
    const plr3 = {
      metadata: {
        name: 'run-3',
        annotations: { [PipelineRunLabel.COMMIT_BRANCH_ANNOTATION]: 'main' },
      },
    };
    mockUsePipelineRunsV2.mockReturnValue([[plr1, plr2, plr3], true, undefined]);
    const { result } = renderHook(() => useComponentBranches('test-ns', 'my-component'));
    expect(result.current[0]).toEqual(['develop', 'main']);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeUndefined();
  });

  it('should call usePipelineRunsV2 with component selector and limit', () => {
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);
    renderHook(() => useComponentBranches('test-ns', 'my-component'));
    expect(mockUsePipelineRunsV2).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: {
          matchLabels: { [PipelineRunLabel.COMPONENT]: 'my-component' },
        },
        limit: 100,
      }),
    );
  });
});
