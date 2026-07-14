import React from 'react';
import type { LogSection } from './types';

const EMPTY_EXPANDED_SECTIONS = new Set<number>();

function getInitialExpandedSections(sections: readonly LogSection[]): Set<number> {
  if (sections.length === 1) return new Set([0]);

  const expanded = new Set<number>();
  for (let i = 0; i < sections.length; i++) {
    if (!sections[i].isCompleted) expanded.add(i);
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
  const prevCompletionRef = React.useRef<boolean[]>(
    sections.map((s) => s.isCompleted ?? false),
  );

  React.useEffect(() => {
    if (!hasSections) {
      prevSectionCountRef.current = 0;
      prevCompletionRef.current = [];
      return;
    }

    const currentSections = sectionsRef.current;
    const prevCount = prevSectionCountRef.current;
    const prevCompletion = prevCompletionRef.current;
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
          if (!currentSections[i].isCompleted) next.add(i);
        }
      }

      if (prevCompletion.length > 0) {
        const newlyCompleted: number[] = [];
        currentSections.forEach((s, i) => {
          if (s.isCompleted && prevCompletion[i] === false) newlyCompleted.push(i);
        });
        if (newlyCompleted.length > 0) {
          const base = next ?? prev;
          next = new Set(base);
          newlyCompleted.forEach((i) => next.delete(i));
        }
      }

      return next ?? prev;
    });

    prevSectionCountRef.current = currentSections.length;
    prevCompletionRef.current = currentSections.map((s) => s.isCompleted ?? false);
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
