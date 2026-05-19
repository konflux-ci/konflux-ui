import { act, renderHook } from '@testing-library/react';
import type { LogSection } from '../types';
import { useSectionFold } from '../useSectionFold';

const section = (name: string, isCompleted = false): LogSection => ({
  name,
  data: `${name} log line 1\n${name} log line 2`,
  isCompleted,
});

describe('useSectionFold', () => {
  // ── Initial state ────────────────────────────────────────────────────────

  describe('initial expandedSections', () => {
    it('expands sections that are not completed', () => {
      const { result } = renderHook(() =>
        useSectionFold([section('init'), section('build'), section('test')]),
      );

      expect(result.current.expandedSections).toEqual(new Set([0, 1, 2]));
    });

    it('collapses completed sections', () => {
      const { result } = renderHook(() =>
        useSectionFold([section('init', true), section('build'), section('test', true)]),
      );

      expect(result.current.expandedSections).toEqual(new Set([1]));
    });

    it('starts with an empty set when every section is completed', () => {
      const { result } = renderHook(() =>
        useSectionFold([section('init', true), section('build', true)]),
      );

      expect(result.current.expandedSections).toEqual(new Set());
    });

    it('starts with all indices when sections is empty', () => {
      const { result } = renderHook(() => useSectionFold([]));

      expect(result.current.expandedSections).toEqual(new Set());
    });
  });

  // ── toggleSection ────────────────────────────────────────────────────────

  describe('toggleSection', () => {
    it('collapses an expanded section', () => {
      const { result } = renderHook(() => useSectionFold([section('init'), section('build')]));

      act(() => result.current.toggleSection(0));

      expect(result.current.expandedSections.has(0)).toBe(false);
      expect(result.current.expandedSections.has(1)).toBe(true);
    });

    it('expands a collapsed section', () => {
      const { result } = renderHook(() =>
        useSectionFold([section('init', true), section('build')]),
      );

      act(() => result.current.toggleSection(0));

      expect(result.current.expandedSections.has(0)).toBe(true);
    });

    it('toggling twice returns to the original state', () => {
      const { result } = renderHook(() => useSectionFold([section('init'), section('build')]));

      act(() => result.current.toggleSection(1));
      act(() => result.current.toggleSection(1));

      expect(result.current.expandedSections.has(1)).toBe(true);
    });
  });

  // ── Auto-expand newly arriving sections ──────────────────────────────────

  describe('auto-expand new sections', () => {
    it('expands a new non-completed section when sections array grows', () => {
      const initial = [section('init'), section('build')];
      const { result, rerender } = renderHook(({ sections }) => useSectionFold(sections), {
        initialProps: { sections: initial },
      });

      act(() => {
        rerender({ sections: [...initial, section('test')] });
      });

      expect(result.current.expandedSections.has(2)).toBe(true);
    });

    it('does not expand a newly arriving section that is already completed', () => {
      const initial = [section('init'), section('build')];
      const { result, rerender } = renderHook(({ sections }) => useSectionFold(sections), {
        initialProps: { sections: initial },
      });

      act(() => {
        rerender({ sections: [...initial, section('test', true)] });
      });

      expect(result.current.expandedSections.has(2)).toBe(false);
    });
  });

  // ── Auto-collapse sections that complete ──────────────────────────────────

  describe('auto-collapse on completion', () => {
    it('collapses a section when it transitions from running to completed', () => {
      const running = [section('init'), section('build')];
      const { result, rerender } = renderHook(({ sections }) => useSectionFold(sections), {
        initialProps: { sections: running },
      });

      // section 0 finishes
      const withCompleted = [section('init', true), section('build')];
      act(() => {
        rerender({ sections: withCompleted });
      });

      expect(result.current.expandedSections.has(0)).toBe(false);
      expect(result.current.expandedSections.has(1)).toBe(true);
    });

    it('does not collapse a section that was already completed on mount', () => {
      const initial = [section('init', true), section('build')];
      const { result, rerender } = renderHook(({ sections }) => useSectionFold(sections), {
        initialProps: { sections: initial },
      });

      // Re-render with same completed state — should not affect expandedSections
      act(() => {
        rerender({ sections: [section('init', true), section('build')] });
      });

      // Section 0 was never in expandedSections, so nothing changes
      expect(result.current.expandedSections.has(0)).toBe(false);
      expect(result.current.expandedSections.has(1)).toBe(true);
    });

    it('collapses multiple sections when they all complete simultaneously', () => {
      const running = [section('a'), section('b'), section('c')];
      const { result, rerender } = renderHook(({ sections }) => useSectionFold(sections), {
        initialProps: { sections: running },
      });

      act(() => {
        rerender({ sections: [section('a', true), section('b', true), section('c')] });
      });

      expect(result.current.expandedSections.has(0)).toBe(false);
      expect(result.current.expandedSections.has(1)).toBe(false);
      expect(result.current.expandedSections.has(2)).toBe(true);
    });

    it('preserves a user-expanded section if it completes after being re-opened', () => {
      const initial = [section('init', true), section('build')];
      const { result, rerender } = renderHook(({ sections }) => useSectionFold(sections), {
        initialProps: { sections: initial },
      });

      // User manually expands the completed section
      act(() => result.current.toggleSection(0));
      expect(result.current.expandedSections.has(0)).toBe(true);

      // A *new* section arrives and completes — section 0 (already completed) stays expanded
      act(() => {
        rerender({ sections: [section('init', true), section('build'), section('test', true)] });
      });

      // Section 0 was already completed, so the auto-collapse effect ignores it;
      // only newly-completed transitions trigger a collapse
      expect(result.current.expandedSections.has(0)).toBe(true);
    });
  });
});
