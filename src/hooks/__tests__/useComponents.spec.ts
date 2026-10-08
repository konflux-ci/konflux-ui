import { renderHook } from '@testing-library/react-hooks';
import { mockComponentsData } from '~/components/ApplicationDetails/__data__/WorkflowComponentsData';
import { useAllComponents, useComponents, useComponentsByName } from '~/hooks/useComponents';
import { ComponentGroupVersionKind, ComponentModel } from '~/models';
import { createK8sWatchResourceMock } from '~/utils/test-utils';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useComponents', () => {
  it('should return empty array when call is inflight', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() => useComponents('test-ns', 'test-dev-samples'));
    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return components when namespace is passed', () => {
    useK8sWatchResourceMock.mockReturnValue([mockComponentsData, true, undefined]);

    const { result } = renderHook(() => useComponents('test-ns', 'test-dev-samples'));
    const [components] = result.current;
    expect(components).toHaveLength(3);
  });
});

describe('useAllComponents', () => {
  it('should return empty array when call is inflight', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() => useAllComponents('test-ns'));
    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return all components in a namespace', () => {
    useK8sWatchResourceMock.mockReturnValue([mockComponentsData, true, undefined]);
    const { result } = renderHook(() => useAllComponents('test-ns'));
    const [components] = result.current;
    expect(components).toHaveLength(3);
  });

  it('should filter out deleted componets', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [...mockComponentsData, { metadata: { name: 'sdfs', deletionTimestamp: 'sad-wqe' } }],
      true,
      undefined,
    ]);
    const { result } = renderHook(() => useAllComponents('test-ns'));
    const [components] = result.current;
    expect(components).toHaveLength(3);
  });
});

describe('useComponentsByName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty array while the request is loading', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useComponentsByName('test-ns', ['component-a'], true));

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return the fetched components after loading completes', () => {
    useK8sWatchResourceMock.mockReturnValue([mockComponentsData, true, undefined]);

    const { result } = renderHook(() => useComponentsByName('test-ns', ['test-dotnet60'], true));

    expect(result.current).toEqual([[mockComponentsData[0]], true, undefined]);
  });

  it('should request all components and filter the requested names and deleted resources', () => {
    const matchingComponent = { metadata: { name: 'component-a' } };
    const otherComponent = { metadata: { name: 'component-c' } };
    const deletingComponent = {
      metadata: { name: 'component-b', deletionTimestamp: '2026-08-01T00:00:00Z' },
    };
    useK8sWatchResourceMock.mockReturnValue([
      [matchingComponent, otherComponent, deletingComponent],
      true,
      undefined,
    ]);

    const { result } = renderHook(() =>
      useComponentsByName('test-ns', ['component-a', 'component-b'], true),
    );

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      {
        groupVersionKind: ComponentGroupVersionKind,
        namespace: 'test-ns',
        isList: true,
        watch: true,
      },
      ComponentModel,
    );

    expect(result.current).toEqual([[matchingComponent], true, undefined]);
  });
});
