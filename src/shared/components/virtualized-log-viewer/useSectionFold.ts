import React from 'react';
import type { LogSection } from './types';

/**
 * Manages fold/expand state for log sections.
 *
 * Rules:
 * - Sections that are already completed start collapsed.
 * - Newly arriving sections auto-expand unless already completed.
 * - A running section auto-collapses when it transitions to completed.
 */
export const useSectionFold = (sections: readonly LogSection[]) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(
    () =>
      new Set(sections.reduce<number[]>((acc, s, i) => (!s.isCompleted ? [...acc, i] : acc), [])),
  );

  // Ref so effects can read latest sections without listing it as a dep
  const sectionsRef = React.useRef(sections);
  sectionsRef.current = sections;

  // Auto-expand newly arriving sections that are not yet completed
  const prevCountRef = React.useRef(sections.length);
  React.useEffect(() => {
    if (sectionsRef.current.length > prevCountRef.current) {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        for (let i = prevCountRef.current; i < sectionsRef.current.length; i++) {
          if (!sectionsRef.current[i].isCompleted) next.add(i);
        }
        return next;
      });
    }
    prevCountRef.current = sectionsRef.current.length;
  }, [sections.length]);

  // Auto-collapse sections that transition from running → completed
  const prevCompletionRef = React.useRef<boolean[]>([]);
  React.useEffect(() => {
    const prev = prevCompletionRef.current;
    const newlyCompleted: number[] = [];
    sections.forEach((s, i) => {
      if (s.isCompleted && !prev[i]) newlyCompleted.push(i);
    });
    prevCompletionRef.current = sections.map((s) => s.isCompleted ?? false);
    if (newlyCompleted.length > 0) {
      setExpandedSections((expanded) => {
        const next = new Set(expanded);
        newlyCompleted.forEach((i) => next.delete(i));
        return next;
      });
    }
  }, [sections]);

  const toggleSection = React.useCallback((sectionIndex: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) next.delete(sectionIndex);
      else next.add(sectionIndex);
      return next;
    });
  }, []);

  return { expandedSections, toggleSection };
};
