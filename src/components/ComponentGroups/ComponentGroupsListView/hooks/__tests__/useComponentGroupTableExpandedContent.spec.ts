import { renderHook, act } from '@testing-library/react';
import { ComponentGroupKind } from '~/types';
import useComponentGroupTableExpandedContent from '../useComponentGroupTableExpandedContent';

const createMockGroup = (name: string): ComponentGroupKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1beta2',
    kind: 'ComponentGroup',
    metadata: { name, namespace: 'test-ns' },
    spec: { components: [] },
  }) as ComponentGroupKind;

describe('useComponentGroupTableExpandedContent', () => {
  it('should initialize with no expanded rows', () => {
    const groups = [createMockGroup('group1'), createMockGroup('group2')];
    const { result } = renderHook(() => useComponentGroupTableExpandedContent(groups));

    expect(result.current.expanded).toEqual({});
  });

  it('should expand a single row', () => {
    const groups = [createMockGroup('group1'), createMockGroup('group2')];
    const { result } = renderHook(() => useComponentGroupTableExpandedContent(groups));

    act(() => {
      result.current.handleExpandedChange?.({ group1: true });
    });

    expect(result.current.expanded).toEqual({ group1: true });
  });

  it('should expand multiple rows', () => {
    const groups = [createMockGroup('group1'), createMockGroup('group2')];
    const { result } = renderHook(() => useComponentGroupTableExpandedContent(groups));

    act(() => {
      result.current.handleExpandedChange?.({ group1: true, group2: true });
    });

    expect(result.current.expanded).toEqual({ group1: true, group2: true });
  });

  it('should collapse a row', () => {
    const groups = [createMockGroup('group1'), createMockGroup('group2')];
    const { result } = renderHook(() => useComponentGroupTableExpandedContent(groups));

    act(() => {
      result.current.handleExpandedChange?.({ group1: true, group2: true });
    });

    expect(result.current.expanded).toEqual({ group1: true, group2: true });

    act(() => {
      result.current.handleExpandedChange?.({ group1: false, group2: true });
    });

    expect(result.current.expanded).toEqual({ group2: true });
  });

  it('should handle updater function to toggle rows', () => {
    const groups = [createMockGroup('group1'), createMockGroup('group2')];
    const { result } = renderHook(() => useComponentGroupTableExpandedContent(groups));

    act(() => {
      result.current.handleExpandedChange?.((old) =>
        typeof old === 'object' ? { ...old, group1: true } : { group1: true },
      );
    });

    expect(result.current.expanded).toEqual({ group1: true });

    act(() => {
      result.current.handleExpandedChange?.((old) =>
        typeof old === 'object' ? { ...old, group2: true } : { group2: true },
      );
    });

    expect(result.current.expanded).toEqual({ group1: true, group2: true });
  });

  it('should expand all rows when true is passed', () => {
    const groups = [
      createMockGroup('group1'),
      createMockGroup('group2'),
      createMockGroup('group3'),
    ];
    const { result } = renderHook(() => useComponentGroupTableExpandedContent(groups));

    act(() => {
      result.current.handleExpandedChange?.(true);
    });

    expect(result.current.expanded).toEqual({
      group1: true,
      group2: true,
      group3: true,
    });
  });

  it('should handle groups with no metadata name', () => {
    const groups = [
      createMockGroup('group1'),
      { ...createMockGroup('group2'), metadata: {} } as ComponentGroupKind,
    ];
    const { result } = renderHook(() => useComponentGroupTableExpandedContent(groups));

    act(() => {
      result.current.handleExpandedChange?.(true);
    });

    expect(result.current.expanded).toEqual({
      group1: true,
      '-': true,
    });
  });

  it('should update when groups prop changes', () => {
    const groups1 = [createMockGroup('group1')];
    const { result, rerender } = renderHook(
      ({ groups }) => useComponentGroupTableExpandedContent(groups),
      { initialProps: { groups: groups1 } },
    );

    act(() => {
      result.current.handleExpandedChange?.({ group1: true });
    });

    expect(result.current.expanded).toEqual({ group1: true });

    const groups2 = [createMockGroup('group1'), createMockGroup('group2')];
    rerender({ groups: groups2 });

    act(() => {
      result.current.handleExpandedChange?.(true);
    });

    expect(result.current.expanded).toEqual({ group1: true, group2: true });
  });

  it('should handle empty groups array', () => {
    const { result } = renderHook(() => useComponentGroupTableExpandedContent([]));

    expect(result.current.expanded).toEqual({});

    act(() => {
      result.current.handleExpandedChange?.(true);
    });

    expect(result.current.expanded).toEqual({});
  });

  it('should not re-expand collapsed rows when passing updater function', () => {
    const groups = [createMockGroup('group1'), createMockGroup('group2')];
    const { result } = renderHook(() => useComponentGroupTableExpandedContent(groups));

    act(() => {
      result.current.handleExpandedChange?.({ group1: true });
    });

    expect(result.current.expanded).toEqual({ group1: true });

    act(() => {
      result.current.handleExpandedChange?.((old) =>
        typeof old === 'object' ? { ...old, group1: false, group2: true } : { group2: true },
      );
    });

    expect(result.current.expanded).toEqual({ group2: true });
  });
});
