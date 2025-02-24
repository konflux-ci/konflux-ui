import { renderHook } from '@testing-library/react-hooks';
import {
  invalidBuildPipelineConfig,
  mockBuildPipelineConfig,
  mockConstPipelineTemplateJson,
  mockDynamicPinelineTemplateJson,
} from '../../__data__/pipeline-config-data';
import { useK8sWatchResource } from '../../k8s';
import { createK8sUtilMock } from '../../utils/test-utils';
import { useBuildPipelineConfig } from '../useBuildPipelineConfig';

const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');

describe('useBuildPipelineConfig', () => {
  it('should return loading state initially', () => {
    k8sWatchMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useBuildPipelineConfig());

    expect(result.current[0]).toEqual(undefined);
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeNull();
  });

  it('should handle error state correctly', () => {
    k8sWatchMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: 'Error occurred',
    });

    const { result } = renderHook(() => useBuildPipelineConfig());

    expect(result.current[0]).toEqual(mockConstPipelineTemplateJson);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBe('Error occurred');
  });

  it('should return dynamic pipeline correctly when data is available', () => {
    k8sWatchMock.mockReturnValue({
      data: mockBuildPipelineConfig,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useBuildPipelineConfig());

    expect(result.current[0]).toEqual(mockDynamicPinelineTemplateJson);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('should handle malformed gracefully and return hardcode pipeline', () => {
    k8sWatchMock.mockReturnValue({
      data: invalidBuildPipelineConfig,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useBuildPipelineConfig());

    // Ensure that even with malformed JSON, the role map is still empty
    expect(result.current[0]).toEqual(mockConstPipelineTemplateJson);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('should memoize the build-pipeline-config', () => {
    k8sWatchMock.mockReturnValue({
      data: mockBuildPipelineConfig,
      isLoading: false,
      error: null,
    });

    const { result, rerender } = renderHook(() => useBuildPipelineConfig());

    const initialPipelineTemplate = result.current[0];

    // Rerender with the same props and check if memoization works (no change)
    rerender();
    expect(result.current[0]).toBe(initialPipelineTemplate);

    // Mock the hook again with the updated configMap
    (useK8sWatchResource as jest.Mock).mockReturnValue({
      data: invalidBuildPipelineConfig,
      isLoading: false,
      error: null,
    });

    rerender();
    // infoJson should have changed
    expect(result.current[0]).not.toBe(initialPipelineTemplate);
  });
});
