import { renderHook } from '@testing-library/react';
import { MOCK_COMPONENT_GROUPS } from '~/components/ComponentGroups/ComponentGroupsListView/__data__/mockComponentGroups';
import { ComponentGroupGroupVersionKind, ComponentGroupModel } from '~/models';
import { createK8sWatchResourceMock } from '~/unit-test-utils';
import { useComponentGroup, useComponentGroups } from '../useComponentGroups';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useComponentGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useK8sWatchResourceMock.mockReturnValue([MOCK_COMPONENT_GROUPS, true, undefined]);
  });

  it('should return groups when loaded', () => {
    const { result } = renderHook(() => useComponentGroups('test-ns', true));

    const [groups, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(groups).toHaveLength(4);
  });

  it('should return an empty array while the request is in flight', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useComponentGroups('test-ns', true));

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return an empty array when the watch fails', () => {
    const mockError = new Error('API error');
    useK8sWatchResourceMock.mockReturnValue([[], true, mockError]);

    const { result } = renderHook(() => useComponentGroups('test-ns', true));

    expect(result.current).toEqual([[], true, mockError]);
  });

  it('should filter out groups that are being deleted', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [
        ...MOCK_COMPONENT_GROUPS,
        {
          ...MOCK_COMPONENT_GROUPS[0],
          metadata: {
            ...MOCK_COMPONENT_GROUPS[0].metadata,
            name: 'deleting-group',
            deletionTimestamp: '2026-08-22T00:00:00Z',
          },
        },
      ],
      true,
      undefined,
    ]);

    const { result } = renderHook(() => useComponentGroups('test-ns', true));
    const [groups] = result.current;

    expect(groups).toHaveLength(4);
    expect(groups.map((group) => group.metadata.name)).not.toContain('deleting-group');
  });

  it('should watch the component group list in the given namespace', () => {
    renderHook(() => useComponentGroups('test-ns', true));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      {
        groupVersionKind: ComponentGroupGroupVersionKind,
        namespace: 'test-ns',
        isList: true,
        watch: true,
      },
      ComponentGroupModel,
    );
  });

  it('should respect watch: false', () => {
    renderHook(() => useComponentGroups('test-ns', false));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({ watch: false }),
      ComponentGroupModel,
    );
  });
});

describe('useComponentGroup', () => {
  const group = MOCK_COMPONENT_GROUPS[0];

  beforeEach(() => {
    jest.clearAllMocks();
    useK8sWatchResourceMock.mockReturnValue([group, true, undefined]);
  });

  it('should return a single group when loaded', () => {
    const { result } = renderHook(() => useComponentGroup('test-ns', 'frontend-stack', true));

    const [componentGroup, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(componentGroup).toEqual(group);
  });

  it('should return null while loading', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useComponentGroup('test-ns', 'frontend-stack', true));

    expect(result.current).toEqual([null, false, undefined]);
  });

  it('should skip the watch when component name is empty', () => {
    renderHook(() => useComponentGroup('test-ns', '', true));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(undefined, ComponentGroupModel);
  });

  it('should watch a named component group', () => {
    renderHook(() => useComponentGroup('test-ns', 'frontend-stack', true));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      {
        groupVersionKind: ComponentGroupGroupVersionKind,
        namespace: 'test-ns',
        name: 'frontend-stack',
        watch: true,
      },
      ComponentGroupModel,
    );
  });

  it('should return a 404 when the group is being deleted', () => {
    useK8sWatchResourceMock.mockReturnValue([
      {
        ...group,
        metadata: {
          ...group.metadata,
          deletionTimestamp: '2026-08-22T00:00:00Z',
        },
      },
      true,
      undefined,
    ]);

    const { result } = renderHook(() => useComponentGroup('test-ns', 'frontend-stack', true));

    expect(result.current).toEqual([null, true, { code: 404 }]);
  });
});
