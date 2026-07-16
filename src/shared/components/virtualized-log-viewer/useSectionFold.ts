import React from 'react';
import type { LogSection } from './types';

const EMPTY_EXPANDED_SECTIONS = new Set<number>();

// A section stays expanded (rather than auto-folded) while it's still running, or if its
// logs failed to fetch -- folding a failed step would hide the only indication of why.
const shouldStayExpanded = (section: LogSection): boolean => !section.isCompleted || !!section.error;

function getInitialExpandedSections(sections: readonly LogSection[]): Set<number> {
  if (sections.length === 1) return new Set([0]);

  const expanded = new Set<number>();
  for (let i = 0; i < sections.length; i++) {
    if (shouldStayExpanded(sections[i])) expanded.add(i);
  }
  return expanded;
}

export const useSectionFold = (sections: readonly LogSection[]) => {
  const hasSections = sections.length >= 1;

  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(() =>
    hasSections ? getInitialExpandedSections(sections) : EMPTY_EXPANDED_SECTIONS,
  );

  const sectionsRef = React.useRef(sections);
  sectionsRef.current = sections;

  const prevSectionCountRef = React.useRef(sections.length);
  const prevCompletionRef = React.useRef<boolean[]>(sections.map((s) => s.isCompleted ?? false));
  const prevErrorRef = React.useRef<boolean[]>(sections.map((s) => !!s.error));

  React.useEffect(() => {
    if (!hasSections) {
      prevSectionCountRef.current = 0;
      prevCompletionRef.current = [];
      prevErrorRef.current = [];
      return;
    }

    const currentSections = sectionsRef.current;
    const prevCount = prevSectionCountRef.current;
    const prevCompletion = prevCompletionRef.current;
    const prevError = prevErrorRef.current;
    const lengthChanged = currentSections.length !== prevCount;

    setExpandedSections((prev) => {
      let next: Set<number> | undefined;

      if (lengthChanged && currentSections.length > 0 && prev.size === 0) {
        next = getInitialExpandedSections(currentSections);
      }

      if (currentSections.length > prevCount && prev.size > 0) {
        const base = next ?? prev;
        next = new Set(base);
        for (let i = prevCount; i < currentSections.length; i++) {
          if (shouldStayExpanded(currentSections[i])) next.add(i);
        }
      }

      if (prevCompletion.length > 0) {
        const newlyCompleted: number[] = [];
        currentSections.forEach((s, i) => {
          // Don't auto-collapse a step that just finished but failed to fetch its logs.
          if (s.isCompleted && !s.error && prevCompletion[i] === false) newlyCompleted.push(i);
        });
        if (newlyCompleted.length > 0) {
          const base = next ?? prev;
          next = new Set(base);
          newlyCompleted.forEach((i) => next.delete(i));
        }
      }

      // A step that already rendered can still fail after the fact (e.g. a websocket
      // connection that later drops) -- expand it so the error becomes visible.
      const newlyErrored: number[] = [];
      currentSections.forEach((s, i) => {
        if (s.error && !prevError[i]) newlyErrored.push(i);
      });
      if (newlyErrored.length > 0) {
        const base = next ?? prev;
        next = new Set(base);
        newlyErrored.forEach((i) => next.add(i));
      }

      return next ?? prev;
    });

    prevSectionCountRef.current = currentSections.length;
    prevCompletionRef.current = currentSections.map((s) => s.isCompleted ?? false);
    prevErrorRef.current = currentSections.map((s) => !!s.error);
  }, [hasSections, sections]);

  const toggleSection = React.useCallback((sectionIndex: number) => {
    if (sectionsRef.current.length === 0) return;
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) next.delete(sectionIndex);
      else next.add(sectionIndex);
      return next;
    });
  }, []);

  const expandSection = React.useCallback((sectionIndex: number) => {
    if (sectionsRef.current.length === 0) return;
    setExpandedSections((prev) => {
      if (prev.has(sectionIndex)) return prev;
      const next = new Set(prev);
      next.add(sectionIndex);
      return next;
    });
  }, []);

  return React.useMemo(
    () => ({
      expandedSections: hasSections ? expandedSections : EMPTY_EXPANDED_SECTIONS,
      toggleSection,
      expandSection,
    }),
    [hasSections, expandedSections, toggleSection, expandSection],
  );
};
