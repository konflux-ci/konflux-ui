import { act, renderHook } from '@testing-library/react';
import type { LogSection } from '../types';
import { useSectionFold } from '../useSectionFold';

const section = (containerName: string, data: string, isCompleted?: boolean): LogSection => ({
  containerName,
  data,
  isCompleted,
});

describe('useSectionFold', () => {
  it('should fold a completed single-section log', () => {
    const sections = [section('task', 'log line', true)];
    const { result } = renderHook(() => useSectionFold(sections));

    expect([...result.current.expandedSections]).toEqual([]);
  });

  it('should expand an incomplete single-section log', () => {
    const sections = [section('task', 'log line', false)];
    const { result } = renderHook(() => useSectionFold(sections));

    expect([...result.current.expandedSections]).toEqual([0]);
  });

  it('should expand running sections and collapse completed ones initially', () => {
    const sections = [section('build', 'done', true), section('test', 'running', false)];
    const { result } = renderHook(() => useSectionFold(sections));

    expect([...result.current.expandedSections]).toEqual([1]);
  });

  it('should collapse all completed sections when multiple are present', () => {
    const sections = [
      section('build', 'done', true),
      section('test', 'done', true),
      section('push', 'done', true),
    ];
    const { result } = renderHook(() => useSectionFold(sections));

    expect([...result.current.expandedSections]).toEqual([]);
  });

  it('should toggle a section open and closed', () => {
    const sections = [section('task', 'log line')];
    const { result } = renderHook(() => useSectionFold(sections));

    act(() => {
      result.current.toggleSection(0);
    });
    expect(result.current.expandedSections.has(0)).toBe(false);

    act(() => {
      result.current.toggleSection(0);
    });
    expect(result.current.expandedSections.has(0)).toBe(true);
  });

  it('should expand a folded section without collapsing others', () => {
    const sections = [section('build', 'done', true), section('test', 'running', false)];
    const { result } = renderHook(() => useSectionFold(sections));

    act(() => {
      result.current.expandSection(0);
    });

    expect([...result.current.expandedSections].sort()).toEqual([0, 1]);
  });

  it('should auto-collapse a section when it becomes completed', () => {
    const initialSections = [section('build', 'running', false), section('test', 'pending', false)];
    const { result, rerender } = renderHook(({ s }) => useSectionFold(s), {
      initialProps: { s: initialSections },
    });

    expect(result.current.expandedSections.has(0)).toBe(true);

    rerender({ s: [section('build', 'done', true), section('test', 'running', false)] });

    expect(result.current.expandedSections.has(0)).toBe(false);
    expect(result.current.expandedSections.has(1)).toBe(true);
  });

  it('should expand newly added running sections', () => {
    const initialSections = [section('build', 'done', true)];
    const { result, rerender } = renderHook(({ s }) => useSectionFold(s), {
      initialProps: { s: initialSections },
    });

    rerender({
      s: [section('build', 'done', true), section('test', 'running', false)],
    });

    expect(result.current.expandedSections.has(0)).toBe(false);
    expect(result.current.expandedSections.has(1)).toBe(true);
  });

  it('should keep completed sections folded during progressive load (single → multi)', () => {
    // Completed steps fold immediately — including when only one section has arrived —
    // so progressive container load does not flash open then closed.
    const { result, rerender } = renderHook(({ s }) => useSectionFold(s), {
      initialProps: { s: [section('build', 'done', true)] },
    });

    expect([...result.current.expandedSections]).toEqual([]);

    rerender({
      s: [section('build', 'done', true), section('test', 'done', true)],
    });

    expect([...result.current.expandedSections]).toEqual([]);

    rerender({
      s: [
        section('build', 'done', true),
        section('test', 'done', true),
        section('push', 'running', false),
      ],
    });

    expect([...result.current.expandedSections]).toEqual([2]);
  });

  it('should keep in-progress steps expanded when others complete', () => {
    const sections = [
      section('build', 'done', true),
      section('test', 'running', false),
      section('push', 'skipped', true),
    ];
    const { result } = renderHook(() => useSectionFold(sections));

    expect([...result.current.expandedSections]).toEqual([1]);
  });

  it('should preserve a user expand override when a later step is appended', () => {
    const { result, rerender } = renderHook(({ s }) => useSectionFold(s), {
      initialProps: {
        s: [section('build', 'done', true), section('test', 'done', true)],
      },
    });

    act(() => {
      result.current.expandSection(0);
    });
    expect(result.current.expandedSections.has(0)).toBe(true);

    rerender({
      s: [
        section('build', 'done', true),
        section('test', 'done', true),
        section('push', 'running', false),
      ],
    });

    expect(result.current.expandedSections.has(0)).toBe(true);
    expect(result.current.expandedSections.has(2)).toBe(true);
  });

  it('should reset overrides when section identity changes (task switch)', () => {
    const { result, rerender } = renderHook(({ s }) => useSectionFold(s), {
      initialProps: {
        s: [section('build', 'done', true), section('test', 'done', true)],
      },
    });

    act(() => {
      result.current.expandSection(0);
    });
    expect(result.current.expandedSections.has(0)).toBe(true);

    rerender({
      s: [section('clone', 'done', true), section('build', 'done', true)],
    });

    expect([...result.current.expandedSections]).toEqual([]);
  });
});
