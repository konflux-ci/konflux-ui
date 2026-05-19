import { renderHook } from '@testing-library/react';
import type { LogSection } from '../types';
import { useSectionRows } from '../useSectionRows';

// ── Helpers ──────────────────────────────────────────────────────────────────

const section = (name: string, data: string, isCompleted = false): LogSection => ({
  name,
  data,
  isCompleted,
});

const ALL_EXPANDED = (sections: readonly LogSection[]) => new Set(sections.map((_, i) => i));

const NONE_EXPANDED = new Set<number>();

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSectionRows', () => {
  // ── displayRows structure ─────────────────────────────────────────────────

  describe('displayRows', () => {
    it('produces section-header + content rows for an expanded section', () => {
      const sections = [section('step-1', 'line a\nline b')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const rows = result.current.displayRows;
      expect(rows).toHaveLength(3); // header + 2 content rows
      expect(rows[0]).toMatchObject({
        kind: 'section-header',
        sectionName: 'step-1',
        sectionIndex: 0,
      });
      expect(rows[1]).toMatchObject({ kind: 'content', sectionIndex: 0, flatLineIndex: 0 });
      expect(rows[2]).toMatchObject({ kind: 'content', sectionIndex: 0, flatLineIndex: 1 });
    });

    it('produces section-header + fold-indicator for a collapsed section', () => {
      const sections = [section('step-1', 'line a\nline b')];
      const { result } = renderHook(() => useSectionRows(sections, NONE_EXPANDED));

      const rows = result.current.displayRows;
      expect(rows).toHaveLength(2); // header + fold-indicator
      expect(rows[0]).toMatchObject({
        kind: 'section-header',
        sectionName: 'step-1',
        isExpanded: false,
      });
      expect(rows[1]).toMatchObject({ kind: 'fold-indicator', sectionIndex: 0, lineCount: 2 });
    });

    it('reflects isExpanded correctly on the section-header row', () => {
      const sections = [section('s', 'x')];
      const { result: expanded } = renderHook(() =>
        useSectionRows(sections, ALL_EXPANDED(sections)),
      );
      const { result: collapsed } = renderHook(() => useSectionRows(sections, NONE_EXPANDED));

      expect(expanded.current.displayRows[0]).toMatchObject({
        kind: 'section-header',
        isExpanded: true,
      });
      expect(collapsed.current.displayRows[0]).toMatchObject({
        kind: 'section-header',
        isExpanded: false,
      });
    });

    it('emits header rows for every section', () => {
      const sections = [section('a', 'x'), section('b', 'y'), section('c', 'z')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const headers = result.current.displayRows.filter((r) => r.kind === 'section-header');
      expect(headers).toHaveLength(3);
    });

    it('interleaves sections correctly when some are expanded and some collapsed', () => {
      const sections = [section('a', 'l1\nl2'), section('b', 'l3')];
      const expandedSections = new Set([0]); // only section 0 expanded
      const { result } = renderHook(() => useSectionRows(sections, expandedSections));

      const rows = result.current.displayRows;
      // section 0 header, 2 content, section 1 header, fold-indicator
      expect(rows).toHaveLength(5);
      expect(rows[0]).toMatchObject({ kind: 'section-header', sectionIndex: 0 });
      expect(rows[1]).toMatchObject({ kind: 'content', sectionIndex: 0 });
      expect(rows[2]).toMatchObject({ kind: 'content', sectionIndex: 0 });
      expect(rows[3]).toMatchObject({ kind: 'section-header', sectionIndex: 1 });
      expect(rows[4]).toMatchObject({ kind: 'fold-indicator', sectionIndex: 1 });
    });
  });

  // ── Global line numbering ─────────────────────────────────────────────────

  describe('global line numbers', () => {
    it('assigns continuous global line numbers across sections', () => {
      const sections = [section('a', 'l1\nl2'), section('b', 'l3\nl4')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const contentRows = result.current.displayRows.filter((r) => r.kind === 'content');
      const lineNumbers = contentRows.map((r) => r.globalLineNumber);
      // header occupies line 1, content rows 2-3, next header line 4, content 5-6
      expect(lineNumbers).toEqual([2, 3, 5, 6]);
    });

    it('accounts for collapsed sections in the global line counter', () => {
      const sections = [section('a', 'l1\nl2'), section('b', 'l3')];
      const expandedSections = new Set([1]); // only section 1 expanded
      const { result } = renderHook(() => useSectionRows(sections, expandedSections));

      const contentRows = result.current.displayRows.filter((r) => r.kind === 'content');
      // section 0: header(1) + 2 collapsed lines → section 1 header gets line 4
      // section 1 content: line 5
      const lineNumbers = contentRows.map((r) => r.globalLineNumber);
      expect(lineNumbers).toEqual([5]);
    });
  });

  // ── allLines ──────────────────────────────────────────────────────────────

  describe('allLines', () => {
    it('includes all lines from every section regardless of fold state', () => {
      const sections = [section('a', 'x\ny'), section('b', 'z')];
      const { result: expanded } = renderHook(() =>
        useSectionRows(sections, ALL_EXPANDED(sections)),
      );
      const { result: collapsed } = renderHook(() => useSectionRows(sections, NONE_EXPANDED));

      expect(expanded.current.allLines).toEqual(['x', 'y', 'z']);
      expect(collapsed.current.allLines).toEqual(['x', 'y', 'z']);
    });

    it('strips ANSI escape codes from log data', () => {
      const sections = [section('s', '\u001b[32mGreen\u001b[0m\nPlain')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      expect(result.current.allLines).toEqual(['Green', 'Plain']);
    });

    it('normalises carriage returns', () => {
      // \r is replaced with \n before splitting, so 'a\rb\rc' → ['a', 'b', 'c']
      // Note: \r\n would become \n\n (two newlines), producing an empty line between them
      const sections = [section('s', 'a\rb\rc')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      expect(result.current.allLines).toEqual(['a', 'b', 'c']);
    });
  });

  // ── flatLineIndex ─────────────────────────────────────────────────────────

  describe('flatLineIndex on content rows', () => {
    it('indexes into allLines correctly for a single expanded section', () => {
      const sections = [section('s', 'alpha\nbeta\ngamma')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const contentRows = result.current.displayRows.filter((r) => r.kind === 'content');
      expect(contentRows.map((r) => r.flatLineIndex)).toEqual([0, 1, 2]);
      expect(contentRows.map((r) => result.current.allLines[r.flatLineIndex])).toEqual([
        'alpha',
        'beta',
        'gamma',
      ]);
    });

    it('indexes correctly across two sections where section 0 is collapsed', () => {
      const sections = [section('a', 'line0\nline1'), section('b', 'line2\nline3')];
      const expandedSections = new Set([1]);
      const { result } = renderHook(() => useSectionRows(sections, expandedSections));

      const contentRows = result.current.displayRows.filter((r) => r.kind === 'content');
      // section 0 had 2 lines (flatLineIndex 0,1 — now hidden), section 1 starts at 2
      expect(contentRows.map((r) => r.flatLineIndex)).toEqual([2, 3]);
      expect(contentRows.map((r) => result.current.allLines[r.flatLineIndex])).toEqual([
        'line2',
        'line3',
      ]);
    });
  });

  // ── searchLineToDisplayRow ────────────────────────────────────────────────

  describe('searchLineToDisplayRow', () => {
    it('maps section-name search line to the section-header display row', () => {
      const sections = [section('step-1', 'line a\nline b')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const { searchLineToDisplayRow, displayRows } = result.current;
      // search line 0 = section name
      const headerDisplayIdx = searchLineToDisplayRow.get(0) ?? -1;
      expect(headerDisplayIdx).toBe(0);
      expect(displayRows[headerDisplayIdx]).toMatchObject({ kind: 'section-header' });
    });

    it('maps content search lines to content display rows when expanded', () => {
      const sections = [section('s', 'alpha\nbeta')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const { searchLineToDisplayRow, displayRows } = result.current;
      // search line 1 = first content line, search line 2 = second content line
      expect(displayRows[searchLineToDisplayRow.get(1) ?? -1]).toMatchObject({ kind: 'content' });
      expect(displayRows[searchLineToDisplayRow.get(2) ?? -1]).toMatchObject({ kind: 'content' });
    });

    it('has no display-row mapping for content lines in a collapsed section', () => {
      const sections = [section('s', 'alpha\nbeta')];
      const { result } = renderHook(() => useSectionRows(sections, NONE_EXPANDED));

      const { searchLineToDisplayRow } = result.current;
      // search line 1 and 2 are inside the collapsed section
      expect(searchLineToDisplayRow.has(1)).toBe(false);
      expect(searchLineToDisplayRow.has(2)).toBe(false);
    });

    it('accounts for the separator between sections', () => {
      const sections = [section('a', 'x'), section('b', 'y')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const { searchLineToDisplayRow, displayRows } = result.current;
      // search string layout:
      //   0: "A" (name)  1: "x" (content)  2: "" (separator)  3: "B" (name)  4: "y"
      expect(displayRows[searchLineToDisplayRow.get(3) ?? -1]).toMatchObject({
        kind: 'section-header',
        sectionIndex: 1,
      });
      expect(displayRows[searchLineToDisplayRow.get(4) ?? -1]).toMatchObject({
        kind: 'content',
        sectionIndex: 1,
      });
    });
  });

  // ── searchLineToSection ───────────────────────────────────────────────────

  describe('searchLineToSection', () => {
    it('maps content search lines to their owning section even when collapsed', () => {
      const sections = [section('a', 'l1\nl2'), section('b', 'l3')];
      const { result } = renderHook(() => useSectionRows(sections, NONE_EXPANDED));

      const { searchLineToSection } = result.current;
      // section 0: search lines 1,2  (line 0 = name, separator at 3, section 1 name at 4, content at 5)
      expect(searchLineToSection.get(1)).toBe(0);
      expect(searchLineToSection.get(2)).toBe(0);
      expect(searchLineToSection.get(5)).toBe(1);
    });

    it('also covers content lines of expanded sections', () => {
      const sections = [section('s', 'a\nb')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const { searchLineToSection } = result.current;
      expect(searchLineToSection.get(1)).toBe(0);
      expect(searchLineToSection.get(2)).toBe(0);
    });
  });

  // ── lineNumberToDisplayRow ────────────────────────────────────────────────

  describe('lineNumberToDisplayRow', () => {
    it('maps global line number to the correct content display row when expanded', () => {
      const sections = [section('s', 'a\nb')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const { lineNumberToDisplayRow, displayRows } = result.current;
      // header = line 1, content lines = 2, 3
      expect(displayRows[lineNumberToDisplayRow.get(2) ?? -1]).toMatchObject({
        kind: 'content',
        globalLineNumber: 2,
      });
      expect(displayRows[lineNumberToDisplayRow.get(3) ?? -1]).toMatchObject({
        kind: 'content',
        globalLineNumber: 3,
      });
    });

    it('has no entry for content lines inside a collapsed section', () => {
      const sections = [section('s', 'a\nb')];
      const { result } = renderHook(() => useSectionRows(sections, NONE_EXPANDED));

      const { lineNumberToDisplayRow } = result.current;
      expect(lineNumberToDisplayRow.has(2)).toBe(false);
      expect(lineNumberToDisplayRow.has(3)).toBe(false);
    });

    it('has no entry for section-header line numbers (headers have no gutter cell)', () => {
      const sections = [section('s', 'a')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      const { lineNumberToDisplayRow } = result.current;
      // header is always line 1
      expect(lineNumberToDisplayRow.has(1)).toBe(false);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty sections array', () => {
      const { result } = renderHook(() => useSectionRows([], new Set()));

      expect(result.current.displayRows).toHaveLength(0);
      expect(result.current.allLines).toHaveLength(0);
    });

    it('handles a section with empty log data', () => {
      const sections = [section('s', '')];
      const { result } = renderHook(() => useSectionRows(sections, ALL_EXPANDED(sections)));

      // data.split('\n') of '' gives [''], so 1 content line
      const rows = result.current.displayRows;
      expect(rows[0]).toMatchObject({ kind: 'section-header' });
      expect(rows[1]).toMatchObject({ kind: 'content', flatLineIndex: 0 });
    });
  });
});
