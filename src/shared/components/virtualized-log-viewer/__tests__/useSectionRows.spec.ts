import { renderHook } from '@testing-library/react';
import type { LogSection } from '../types';
import { useSectionRows } from '../useSectionRows';

const section = (
  containerName: string,
  data: string,
  isCompleted?: boolean,
): LogSection => ({
  containerName,
  data,
  isCompleted,
});

describe('useSectionRows', () => {
  it('should return empty rows for no sections', () => {
    const { result } = renderHook(() => useSectionRows([], new Set()));

    expect(result.current.displayRows).toEqual([]);
    expect(result.current.allLines).toEqual([]);
  });

  it('should render content rows when expanded and fold indicators when collapsed', () => {
    const sections = [
      section('build', 'compile\nlink', true),
      section('test', 'running', false),
    ];
    const expanded = new Set([1]);
    const { result } = renderHook(() => useSectionRows(sections, expanded));

    expect(result.current.displayRows.map((row) => row.kind)).toEqual([
      'section-header',
      'fold-indicator',
      'section-header',
      'content',
    ]);
    expect(result.current.allLines).toEqual(['compile', 'link', 'running']);
  });

  it('should map search lines to display rows and flat line indexes', () => {
    const sections = [section('build', 'line one\nline two', false)];
    const expanded = new Set([0]);
    const { result } = renderHook(() => useSectionRows(sections, expanded));

    expect(result.current.searchLineToDisplayRow.get(0)).toBe(0);
    expect(result.current.searchLineToDisplayRow.get(1)).toBe(1);
    expect(result.current.searchLineToDisplayRow.get(2)).toBe(2);

    expect(result.current.searchLineToFlatLineIndex.get(1)).toBe(0);
    expect(result.current.searchLineToFlatLineIndex.get(2)).toBe(1);

    expect(result.current.searchLineToSectionIndex.get(0)).toBe(0);
    expect(result.current.searchLineToSectionIndex.get(2)).toBe(0);

    expect(result.current.lineNumberToDisplayRow.get(1)).toBe(0);
    expect(result.current.lineNumberToDisplayRow.get(2)).toBe(1);
    expect(result.current.lineNumberToDisplayRow.get(3)).toBe(2);
  });

  it('should add a blank search line between multi-section blocks', () => {
    const sections = [
      section('build', 'a', true),
      section('test', 'b', false),
    ];
    const expanded = new Set([0, 1]);
    const { result } = renderHook(() => useSectionRows(sections, expanded));

    expect(result.current.searchLineToSectionIndex.get(1)).toBe(0);
    expect(result.current.searchLineToSectionIndex.get(2)).toBeUndefined();
    expect(result.current.searchLineToSectionIndex.get(3)).toBe(1);
    expect(result.current.searchLineToSectionIndex.get(4)).toBe(1);
  });
});
