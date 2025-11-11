import { renderHook } from '@testing-library/react-hooks';
import { createK8sWatchResourceMock } from '~/unit-test-utils';
import { ReleasePlanAdmissionModel } from '../../models/release-plan-admission';
import { useReleasePlanAdmissions } from '../useReleasePlanAdmissions';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useReleasePlanAdmissions', () => {
  const mockReleasePlanAdmissions = [
    {
      metadata: { name: 'admission-1', namespace: 'test-namespace' },
      spec: { application: 'test-app' },
    },
    {
      metadata: { name: 'admission-2', namespace: 'test-namespace' },
      spec: { application: 'test-app' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return release plan admissions when data is loaded', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: mockReleasePlanAdmissions,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useReleasePlanAdmissions('test-namespace'));

    expect(result.current).toEqual([mockReleasePlanAdmissions, true, undefined]);
  });

  it('should return empty array and loading state when data is loading', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: [],
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useReleasePlanAdmissions('test-namespace'));

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return error when there is an error', () => {
    const mockError = new Error('Failed to fetch release plan admissions');
    useK8sWatchResourceMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useReleasePlanAdmissions('test-namespace'));

    expect(result.current).toEqual([[], true, mockError]);
  });

  it('should call useK8sWatchResource with correct parameters', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: mockReleasePlanAdmissions,
      isLoading: false,
      error: undefined,
    });

    renderHook(() => useReleasePlanAdmissions('test-namespace'));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      {
        groupVersionKind: {
          group: 'appstudio.redhat.com',
          version: 'v1alpha1',
          kind: 'ReleasePlanAdmission',
        },
        namespace: 'test-namespace',
        isList: true,
      },
      ReleasePlanAdmissionModel,
    );
  });

  it('should re-fetch when namespace changes', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: mockReleasePlanAdmissions,
      isLoading: false,
      error: undefined,
    });

    const { rerender } = renderHook(({ namespace }) => useReleasePlanAdmissions(namespace), {
      initialProps: { namespace: 'namespace-1' },
    });

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'namespace-1',
      }),
      ReleasePlanAdmissionModel,
    );

    rerender({ namespace: 'namespace-2' });

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'namespace-2',
      }),
      ReleasePlanAdmissionModel,
    );
  });

  it('should handle empty namespace', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useReleasePlanAdmissions(''));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: '',
      }),
      ReleasePlanAdmissionModel,
    );
    expect(result.current).toEqual([[], true, undefined]);
  });

  it('should return the correct loading state based on isLoading property', () => {
    // Test loaded state (isLoading: false)
    useK8sWatchResourceMock.mockReturnValue({
      data: mockReleasePlanAdmissions,
      isLoading: false,
      error: undefined,
    });

    const { result, rerender } = renderHook(() => useReleasePlanAdmissions('test-namespace'));
    expect(result.current[1]).toBe(true); // loaded = !isLoading

    // Test loading state (isLoading: true)
    useK8sWatchResourceMock.mockReturnValue({
      data: [],
      isLoading: true,
      error: undefined,
    });

    rerender();
    expect(result.current[1]).toBe(false); // loaded = !isLoading
  });

  it('should handle null or undefined data', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useReleasePlanAdmissions('test-namespace'));

    expect(result.current).toEqual([null, true, undefined]);
  });

  it('should preserve data types correctly', () => {
    const typedAdmissions = mockReleasePlanAdmissions;
    useK8sWatchResourceMock.mockReturnValue({
      data: typedAdmissions,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useReleasePlanAdmissions('test-namespace'));

    expect(result.current[0]).toBe(typedAdmissions);
    expect(Array.isArray(result.current[0])).toBe(true);
  });
});
