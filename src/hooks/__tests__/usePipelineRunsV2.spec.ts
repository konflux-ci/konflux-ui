import { renderHook } from '@testing-library/react-hooks';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveGetResourceQuery } from '~/kubearchive/hooks';
import { PipelineRunModel } from '../../models';
import { createK8sWatchResourceMock, createUseApplicationMock } from '../../utils/test-utils';
import { usePipelineRunV2 } from '../usePipelineRunsV2';
import { useTRPipelineRuns } from '../useTektonResults';

jest.mock('../useTektonResults');
jest.mock('../useComponents');
jest.mock('~/feature-flags/hooks');
jest.mock('~/kubearchive/hooks');

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;
const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useIsOnFeatureFlagMock = useIsOnFeatureFlag as jest.Mock;
const useKubearchiveGetResourceQueryMock = useKubearchiveGetResourceQuery as jest.Mock;

describe('usePipelineRunV2', () => {
  const mockPipelineRun = {
    kind: 'PipelineRun',
    metadata: { name: 'test-pipeline-run', namespace: 'test-ns' },
    spec: {},
    status: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when disabled', () => {
    it('should return undefined data when parameter is undefined', () => {
      useIsOnFeatureFlagMock.mockReturnValue(false);
      useK8sWatchResourceMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
      useTRPipelineRunsMock.mockReturnValue([[], true, null]);
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePipelineRunV2(undefined, 'test-pipeline-run'));

      expect(result.current).toEqual([undefined, false, undefined]);
    });
  });

  describe('cluster data priority', () => {
    it('should return cluster data when available, regardless of kubearchive flag', () => {
      useIsOnFeatureFlagMock.mockReturnValue(true);
      useK8sWatchResourceMock.mockReturnValue({
        data: mockPipelineRun,
        isLoading: false,
        error: null,
      });
      useTRPipelineRunsMock.mockReturnValue([[], true, null]);
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: mockPipelineRun,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(result.current).toEqual([mockPipelineRun, true, null]);
    });

    it('should return cluster data even when cluster is loading', () => {
      useIsOnFeatureFlagMock.mockReturnValue(false);
      useK8sWatchResourceMock.mockReturnValue({
        data: mockPipelineRun,
        isLoading: true,
        error: null,
      });
      useTRPipelineRunsMock.mockReturnValue([[mockPipelineRun], true, null]);

      const { result } = renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(result.current).toEqual([mockPipelineRun, false, null]);
    });
  });

  describe('kubearchive data source', () => {
    beforeEach(() => {
      // No cluster data available
      useK8sWatchResourceMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
    });

    it('should return kubearchive data when kubearchive flag is enabled and data is available', () => {
      useIsOnFeatureFlagMock.mockReturnValue(true);
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: mockPipelineRun,
        isLoading: false,
        error: null,
      });
      useTRPipelineRunsMock.mockReturnValue([[], true, null]);

      const { result } = renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(result.current).toEqual([mockPipelineRun, true, null]);
    });

    it('should return undefined when kubearchive flag is enabled but kubearchive has error', () => {
      const kubearchiveError = new Error('Kubearchive error');
      useIsOnFeatureFlagMock.mockReturnValue(true);
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: kubearchiveError,
      });
      useTRPipelineRunsMock.mockReturnValue([[], true, null]);

      const { result } = renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(result.current).toEqual([null, true, kubearchiveError]);
    });

    it('should return loading state when kubearchive is loading', () => {
      useIsOnFeatureFlagMock.mockReturnValue(true);
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });
      useTRPipelineRunsMock.mockReturnValue([[], true, null]);

      const { result } = renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(result.current).toEqual([null, false, null]);
    });

    it('should call useTRPipelineRuns with undefinednamespace when kubearchive is enabled', () => {
      useIsOnFeatureFlagMock.mockReturnValue(true);
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: mockPipelineRun,
        isLoading: false,
        error: null,
      });
      useTRPipelineRunsMock.mockReturnValue([[], true, null]);

      renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(useTRPipelineRunsMock).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          filter: expect.any(String),
          limit: 1,
        }),
      );
    });
  });

  describe('tekton data source fallback', () => {
    beforeEach(() => {
      // No cluster data available and kubearchive disabled
      useK8sWatchResourceMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
      useIsOnFeatureFlagMock.mockReturnValue(false);
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
    });

    it('should return tekton data when kubearchive is disabled and tekton has data', () => {
      useTRPipelineRunsMock.mockReturnValue([[mockPipelineRun], true, null]);

      const { result } = renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(result.current).toEqual([mockPipelineRun, true, null]);
    });

    it('should return loading state when tekton is loading and has no data', () => {
      useTRPipelineRunsMock.mockReturnValue([[], false, null]);

      const { result } = renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(result.current).toEqual([undefined, false, null]);
    });

    it('should return error when tekton has no data but has error', () => {
      const tektonError = new Error('Tekton error');
      useTRPipelineRunsMock.mockReturnValue([[], true, tektonError]);

      const { result } = renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(result.current).toEqual([undefined, true, tektonError]);
    });

    it('should call useTRPipelineRuns with namespace when kubearchive is disabled', () => {
      useTRPipelineRunsMock.mockReturnValue([[mockPipelineRun], true, null]);

      renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(useTRPipelineRunsMock).toHaveBeenCalledWith(
        'test-ns',
        expect.objectContaining({
          filter: expect.any(String),
          limit: 1,
        }),
      );
    });

    it('should call useKubearchiveGetResourceQuery with enabled=false when kubearchive is disabled', () => {
      useTRPipelineRunsMock.mockReturnValue([[mockPipelineRun], true, null]);

      renderHook(() => usePipelineRunV2('test-ns', 'test-pipeline-run'));

      expect(useKubearchiveGetResourceQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          groupVersionKind: expect.any(Object),
          namespace: 'test-ns',
          name: 'test-pipeline-run',
        }),
        PipelineRunModel,
        { enabled: false }, // queryOptions
      );
    });
  });
});
