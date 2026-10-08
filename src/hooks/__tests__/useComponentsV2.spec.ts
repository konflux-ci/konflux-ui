import { renderHook } from '@testing-library/react';
import { useAllComponentsV2, useComponentV2, useComponentsByNameV2 } from '~/hooks/useComponentsV2';
import { ComponentModelV2 } from '~/models';
import { ComponentKind } from '~/types';
import { createK8sWatchResourceMock } from '~/unit-test-utils';

const watchMock = createK8sWatchResourceMock();
const component = {
  apiVersion: 'konflux-ci.dev/v1alpha1',
  kind: 'Component',
  metadata: { name: 'frontend', namespace: 'test-ns' },
  spec: { source: { url: 'https://github.com/example/frontend' } },
} as ComponentKind;
const otherComponent = { ...component, metadata: { ...component.metadata, name: 'backend' } };
const deletingComponent = {
  ...component,
  metadata: { ...component.metadata, name: 'deleted', deletionTimestamp: '2026-10-08T00:00:00Z' },
};

beforeEach(() => {
  jest.clearAllMocks();
  watchMock.mockReturnValue([[component, otherComponent, deletingComponent], true, undefined]);
});

describe('useAllComponentsV2', () => {
  it('requests the new API and retains components without versions while excluding deletions', () => {
    const { result } = renderHook(() => useAllComponentsV2('test-ns', true));

    expect(watchMock).toHaveBeenCalledWith(
      {
        groupVersionKind: { group: 'konflux-ci.dev', version: 'v1alpha1', kind: 'Component' },
        namespace: 'test-ns',
        isList: true,
        watch: true,
      },
      expect.objectContaining({
        apiGroup: 'konflux-ci.dev',
        apiVersion: 'v1alpha1',
        kind: 'Component',
        plural: 'components',
        namespaced: true,
      }),
    );
    expect(result.current).toEqual([[component, otherComponent], true, undefined]);
  });

  it('returns an empty list while loading', () => {
    watchMock.mockReturnValue([[component], false, undefined]);
    const { result } = renderHook(() => useAllComponentsV2('test-ns'));
    expect(result.current).toEqual([[], false, undefined]);
  });

  it('propagates errors without displaying stale data', () => {
    const error = { code: 403 };
    watchMock.mockReturnValue([[component], true, error]);
    const { result } = renderHook(() => useAllComponentsV2('test-ns'));
    expect(result.current).toEqual([[], true, error]);
  });

  it('handles an empty response and disables fetching without a namespace', () => {
    watchMock.mockReturnValue({ data: undefined, isLoading: false, error: undefined });
    const { result } = renderHook(() => useAllComponentsV2(''));
    expect(watchMock).toHaveBeenCalledWith(undefined, ComponentModelV2);
    expect(result.current).toEqual([[], true, undefined]);
  });

  it('keeps its result stable until the watched resources change', () => {
    const { result, rerender } = renderHook(() => useAllComponentsV2('test-ns'));
    const previous = result.current;
    rerender();
    expect(result.current).toBe(previous);

    watchMock.mockReturnValue([[otherComponent], true, undefined]);
    rerender();
    expect(result.current).toEqual([[otherComponent], true, undefined]);
  });
});

describe('useComponentsByNameV2', () => {
  it('returns only requested, non-deleting components without duplicate rows', () => {
    const { result } = renderHook(() =>
      useComponentsByNameV2('test-ns', ['frontend', 'frontend', 'deleted', 'missing'], true),
    );
    expect(result.current).toEqual([[component], true, undefined]);
    expect(watchMock).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: 'test-ns', watch: true }),
      ComponentModelV2,
    );
  });

  it('does not fetch for an empty group', () => {
    watchMock.mockReturnValue({ data: undefined, isLoading: false, error: undefined });
    const { result } = renderHook(() => useComponentsByNameV2('test-ns', [], true));
    expect(watchMock).toHaveBeenCalledWith(undefined, ComponentModelV2);
    expect(result.current).toEqual([[], true, undefined]);
  });

  it('updates membership when the requested names change and otherwise keeps a stable result', () => {
    const initialProps = { names: ['frontend'] };
    const { result, rerender } = renderHook(
      ({ names }) => useComponentsByNameV2('test-ns', names),
      { initialProps },
    );
    const previous = result.current;
    rerender(initialProps);
    expect(result.current).toBe(previous);
    rerender({ names: ['backend'] });
    expect(result.current).toEqual([[otherComponent], true, undefined]);
  });
});

describe('useComponentV2', () => {
  it('fetches an individual new-model component with watch support', () => {
    watchMock.mockReturnValue([component, true, undefined]);
    const { result } = renderHook(() => useComponentV2('test-ns', 'frontend', true));
    expect(watchMock).toHaveBeenCalledWith(
      {
        groupVersionKind: { group: 'konflux-ci.dev', version: 'v1alpha1', kind: 'Component' },
        namespace: 'test-ns',
        name: 'frontend',
        watch: true,
      },
      ComponentModelV2,
    );
    expect(result.current).toEqual([component, true, undefined]);
  });

  it.each([
    ['test-ns', ''],
    ['', 'frontend'],
  ])('does not fetch without namespace and name (%s, %s)', (namespace, name) => {
    watchMock.mockReturnValue({ data: undefined, isLoading: false, error: undefined });
    renderHook(() => useComponentV2(namespace, name));
    expect(watchMock).toHaveBeenCalledWith(undefined, ComponentModelV2);
  });

  it('returns not found for a deleting component', () => {
    watchMock.mockReturnValue([deletingComponent, true, undefined]);
    const { result } = renderHook(() => useComponentV2('test-ns', 'deleted'));
    expect(result.current).toEqual([null, true, { code: 404 }]);
  });

  it('preserves loading and API errors', () => {
    watchMock.mockReturnValue({ data: undefined, isLoading: true, error: undefined });
    const { result, rerender } = renderHook(() => useComponentV2('test-ns', 'frontend'));
    expect(result.current).toEqual([null, false, undefined]);
    const error = { code: 403 };
    watchMock.mockReturnValue({ data: undefined, isLoading: false, error });
    rerender();
    expect(result.current).toEqual([null, true, error]);
  });
});
