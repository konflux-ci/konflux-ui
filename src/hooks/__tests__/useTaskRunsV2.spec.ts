import { renderHook } from '@testing-library/react-hooks';
import { useIsOnFeatureFlag } from '../../feature-flags/hooks';
import { useKubearchiveGetResourceQuery } from '../../kubearchive/hooks';
import { TaskRunGroupVersionKind, TaskRunModel } from '../../models';
import { createK8sWatchResourceMock, createUseApplicationMock } from '../../utils/test-utils';
import { useTaskRunV2 } from '../useTaskRunsV2';
import { useTRTaskRuns } from '../useTektonResults';

jest.mock('../useTektonResults');
jest.mock('../../kubearchive/hooks');
jest.mock('../../feature-flags/hooks');

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useTRTaskRunsMock = useTRTaskRuns as jest.Mock;
const useKubearchiveGetResourceQueryMock = useKubearchiveGetResourceQuery as jest.Mock;
const useIsOnFeatureFlagMock = useIsOnFeatureFlag as jest.Mock;
const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useTaskRunV2', () => {
  const mockTaskRun = {
    kind: TaskRunGroupVersionKind.kind,
    metadata: {
      name: 'test-taskrun',
      namespace: 'test-ns',
      uid: 'test-uid',
    },
    spec: {},
    status: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when kubearchive feature flag is enabled', () => {
    beforeEach(() => {
      useIsOnFeatureFlagMock.mockImplementation((flag: string) => flag === 'taskruns-kubearchive');
    });

    it('should call hooks with correct parameters', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], false, undefined]);

      renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace: 'test-ns',
          name: 'test-taskrun',
          watch: true,
        },
        TaskRunModel,
        { retry: false },
      );
      expect(useKubearchiveGetResourceQueryMock).toHaveBeenCalledWith(
        {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace: 'test-ns',
          name: 'test-taskrun',
        },
        TaskRunModel,
      );
      expect(useTRTaskRunsMock).toHaveBeenCalledWith(null, {
        name: 'test-taskrun',
        limit: 1,
        filter: 'data.metadata.name == "test-taskrun"',
      });
    });

    it('should return data from k8s when available', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: mockTaskRun, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([mockTaskRun, true, null]);
    });

    it('should return loading state when k8s is loading', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, false, null]);
    });

    it('should return data from kubearchive when k8s has no data', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: mockTaskRun,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([mockTaskRun, true, null]);
    });

    it('should return loading state when kubearchive is loading', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, false, null]);
    });

    it('should return error when both k8s and kubearchive fail', () => {
      const error = { code: 404, message: 'Not found' };
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, true, error]);
    });
  });

  describe('when kubearchive feature flag is disabled', () => {
    beforeEach(() => {
      useIsOnFeatureFlagMock.mockImplementation(() => false);
    });

    it('should call hooks with correct parameters when kubearchive is disabled', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], false, undefined]);

      renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        {
          groupVersionKind: TaskRunGroupVersionKind,
          namespace: 'test-ns',
          name: 'test-taskrun',
          watch: true,
        },
        TaskRunModel,
        { retry: false },
      );
      expect(useKubearchiveGetResourceQueryMock).toHaveBeenCalledWith(null, TaskRunModel);
      expect(useTRTaskRunsMock).toHaveBeenCalledWith('test-ns', {
        name: 'test-taskrun',
        limit: 1,
        filter: 'data.metadata.name == "test-taskrun"',
      });
    });

    it('should return data from k8s when available and kubearchive disabled', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: mockTaskRun, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([mockTaskRun, true, null]);
    });

    it('should return data from tekton results when k8s has no data and kubearchive disabled', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[mockTaskRun], true, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([mockTaskRun, true, undefined]);
    });

    it('should return loading state when tekton results is loading', () => {
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], false, undefined]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, false, null]);
    });

    it('should return error when k8s and tekton results both fail', () => {
      const error = { code: 500, message: 'Server error' };
      useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error });
      useKubearchiveGetResourceQueryMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });
      useTRTaskRunsMock.mockReturnValue([[], true, error]);

      const { result } = renderHook(() => useTaskRunV2('test-ns', 'test-taskrun'));

      expect(result.current).toEqual([undefined, true, error]);
    });
  });

  it('should handle parameter changes correctly', () => {
    useIsOnFeatureFlagMock.mockImplementation((flag: string) => flag === 'taskruns-kubearchive');
    useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    useKubearchiveGetResourceQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });
    useTRTaskRunsMock.mockReturnValue([[], false, undefined]);

    const { rerender } = renderHook(
      ({ namespace, taskRunName }) => useTaskRunV2(namespace, taskRunName),
      {
        initialProps: { namespace: 'test-ns', taskRunName: 'test-taskrun' },
      },
    );

    rerender({ namespace: 'new-ns', taskRunName: 'new-taskrun' });

    expect(useK8sWatchResourceMock).toHaveBeenLastCalledWith(
      {
        groupVersionKind: TaskRunGroupVersionKind,
        namespace: 'new-ns',
        name: 'new-taskrun',
        watch: true,
      },
      TaskRunModel,
      { retry: false },
    );
  });
});
