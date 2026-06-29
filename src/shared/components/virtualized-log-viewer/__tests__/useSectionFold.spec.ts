import { act, renderHook } from '@testing-library/react';
import type { LogSection } from '../types';
import { useSectionFold } from '../useSectionFold';

const section = (
  containerName: string,
  data: string,
  isCompleted?: boolean,
): LogSection => ({
  containerName,
  data,
  isCompleted,
});

describe('useSectionFold', () => {
  it('should expand the only section for single-section logs', () => {
    const sections = [section('task', 'log line')];
    const { result } = renderHook(() => useSectionFold(sections));

    expect([...result.current.expandedSections]).toEqual([0]);
  });

  it('should expand running sections and collapse completed ones initially', () => {
    const sections = [
      section('build', 'done', true),
      section('test', 'running', false),
    ];
    const { result } = renderHook(() => useSectionFold(sections));

    expect([...result.current.expandedSections]).toEqual([1]);
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
    const sections = [
      section('build', 'done', true),
      section('test', 'running', false),
    ];
    const { result } = renderHook(() => useSectionFold(sections));

    act(() => {
      result.current.expandSection(0);
    });

    expect([...result.current.expandedSections].sort()).toEqual([0, 1]);
  });

  it('should auto-collapse a section when it becomes completed', () => {
    const initialSections = [section('build', 'running', false)];
    const { result, rerender } = renderHook(({ s }) => useSectionFold(s), {
      initialProps: { s: initialSections },
    });

    expect(result.current.expandedSections.has(0)).toBe(true);

    rerender({ s: [section('build', 'done', true)] });

    expect(result.current.expandedSections.has(0)).toBe(false);
  });

  it('should expand newly added running sections', () => {
    const initialSections = [section('build', 'done', true)];
    const { result, rerender } = renderHook(({ s }) => useSectionFold(s), {
      initialProps: { s: initialSections },
    });

    rerender({
      s: [section('build', 'done', true), section('test', 'running', false)],
    });

    expect(result.current.expandedSections.has(1)).toBe(true);
  });
});
