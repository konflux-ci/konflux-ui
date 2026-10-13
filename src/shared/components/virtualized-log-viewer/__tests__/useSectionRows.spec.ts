import { renderHook } from '@testing-library/react';
import { normalizeLogLines } from '../log-viewer-utils';
import type { NormalizedLogSection } from '../types';
import { useSectionRows } from '../useSectionRows';

const normSection = (containerName: string, data: string): NormalizedLogSection => ({
  containerName,
  lines: normalizeLogLines(data),
});

describe('useSectionRows', () => {
  it('should return empty rows for no sections', () => {
    const { result } = renderHook(() => useSectionRows([], new Set()));

    expect(result.current.displayRows).toEqual([]);
    expect(result.current.allLines).toEqual([]);
  });

  it('should render content rows when expanded and fold indicators when collapsed', () => {
    const sections = [normSection('build', 'compile\nlink'), normSection('test', 'running')];
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

  it('should map line numbers to display rows and section indexes', () => {
    const sections = [normSection('build', 'line one\nline two')];
    const expanded = new Set([0]);
    const { result } = renderHook(() => useSectionRows(sections, expanded));

    expect(result.current.lineNumberToDisplayRow.get(1)).toBe(0);
    expect(result.current.lineNumberToDisplayRow.get(2)).toBe(1);
    expect(result.current.lineNumberToDisplayRow.get(3)).toBe(2);

    expect(result.current.lineNumberToSectionIndex.get(1)).toBe(0);
    expect(result.current.lineNumberToSectionIndex.get(2)).toBe(0);
    expect(result.current.lineNumberToSectionIndex.get(3)).toBe(0);
  });

  it('should map line numbers across multiple sections', () => {
    const sections = [normSection('build', 'a'), normSection('test', 'b')];
    const expanded = new Set([0, 1]);
    const { result } = renderHook(() => useSectionRows(sections, expanded));

    // Section 0: header at line 1, content 'a' at line 2
    expect(result.current.lineNumberToSectionIndex.get(1)).toBe(0);
    expect(result.current.lineNumberToSectionIndex.get(2)).toBe(0);

    // Section 1: header at line 3, content 'b' at line 4
    expect(result.current.lineNumberToSectionIndex.get(3)).toBe(1);
    expect(result.current.lineNumberToSectionIndex.get(4)).toBe(1);
  });
});
