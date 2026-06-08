import React from 'react';
import { normalizeLogLines } from './log-viewer-utils';
import type { LogDisplayRow, LogSection } from './types';

export interface SectionRowsResult {
  displayRows: LogDisplayRow[];
  allLines: string[];
  searchLineToDisplayRow: Map<number, number>;
  /** Search line index (toolbar) → flat content line index for highlighting */
  searchLineToFlatLineIndex: Map<number, number>;
  /** Search line index → section index (used to expand folded steps before scroll) */
  searchLineToSectionIndex: Map<number, number>;
  lineNumberToDisplayRow: Map<number, number>;
}

const EMPTY_EXPANDED_SECTIONS = new Set<number>();
const noopToggleSection = (_sectionIndex: number) => undefined;

const EMPTY_SEARCH_MAP = new Map<number, number>();
const EMPTY_SECTION_ROWS: SectionRowsResult = {
  displayRows: [],
  allLines: [],
  searchLineToDisplayRow: EMPTY_SEARCH_MAP,
  searchLineToFlatLineIndex: EMPTY_SEARCH_MAP,
  searchLineToSectionIndex: EMPTY_SEARCH_MAP,
  lineNumberToDisplayRow: EMPTY_SEARCH_MAP,
};

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

  React.useEffect(() => {
    if (sections.length === 0) return;
    setExpandedSections((prev) => {
      if (prev.size > 0) return prev;
      return getInitialExpandedSections(sectionsRef.current);
    });
  }, [sections.length]);

  const prevCountRef = React.useRef(sections.length);
  React.useEffect(() => {
    if (!hasSections) return;

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
  }, [hasSections, sections.length]);

  const prevCompletionRef = React.useRef<boolean[]>([]);
  React.useEffect(() => {
    if (!hasSections) return;

    const prev = prevCompletionRef.current;
    const newlyCompleted: number[] = [];
    sections.forEach((s, i) => {
      if (prev.length > 0 && s.isCompleted && prev[i] === false) newlyCompleted.push(i);
    });
    prevCompletionRef.current = sections.map((s) => s.isCompleted ?? false);
    if (newlyCompleted.length > 0) {
      setExpandedSections((expanded) => {
        const next = new Set(expanded);
        newlyCompleted.forEach((i) => next.delete(i));
        return next;
      });
    }
  }, [hasSections, sections]);

  const toggleSection = React.useCallback((sectionIndex: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) next.delete(sectionIndex);
      else next.add(sectionIndex);
      return next;
    });
  }, []);

  const expandSection = React.useCallback((sectionIndex: number) => {
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
      toggleSection: hasSections ? toggleSection : noopToggleSection,
      expandSection: hasSections ? expandSection : noopToggleSection,
    }),
    [hasSections, expandedSections, toggleSection, expandSection],
  );
};

export const useSectionRows = (
  sections: readonly LogSection[],
  expandedSections: Set<number>,
): SectionRowsResult => {
  return React.useMemo(() => {
    if (sections.length === 0) return EMPTY_SECTION_ROWS;
    const processedSections = sections.map((s) => normalizeLogLines(s.data));
    const allLines = processedSections.flat();
    const rows: LogDisplayRow[] = [];
    const searchToDisplay = new Map<number, number>();
    const searchToFlatLine = new Map<number, number>();
    const searchToSection = new Map<number, number>();
    const lineNumToDisplay = new Map<number, number>();

    let globalLineNumber = 1;
    let flatLineIndex = 0;
    let searchLine = 0;

    for (let i = 0; i < sections.length; i++) {
      const sectionLines = processedSections[i];
      const isExpanded = expandedSections.has(i);

      const headerDisplayIdx = rows.length;
      rows.push({
        kind: 'section-header',
        sectionName: sections[i].containerName,
        sectionIndex: i,
        lineNumber: globalLineNumber,
        lineCount: sectionLines.length,
        isExpanded,
      });
      searchToDisplay.set(searchLine, headerDisplayIdx);
      searchToSection.set(searchLine, i);
      lineNumToDisplay.set(globalLineNumber, headerDisplayIdx);
      searchLine++;
      globalLineNumber++;

      for (let j = 0; j < sectionLines.length; j++) {
        searchToFlatLine.set(searchLine + j, flatLineIndex + j);
        searchToSection.set(searchLine + j, i);
      }

      if (isExpanded) {
        for (let j = 0; j < sectionLines.length; j++) {
          const contentDisplayIdx = rows.length;
          rows.push({
            kind: 'content',
            globalLineNumber: globalLineNumber + j,
            flatLineIndex: flatLineIndex + j,
            sectionIndex: i,
          });
          searchToDisplay.set(searchLine + j, contentDisplayIdx);
          lineNumToDisplay.set(globalLineNumber + j, contentDisplayIdx);
        }
      } else {
        rows.push({ kind: 'fold-indicator', sectionIndex: i, lineCount: sectionLines.length });
      }

      searchLine += sectionLines.length;
      globalLineNumber += sectionLines.length;
      flatLineIndex += sectionLines.length;

      if (i < sections.length - 1) {
        searchLine++;
      }
    }

    return {
      displayRows: rows,
      allLines,
      searchLineToDisplayRow: searchToDisplay,
      searchLineToFlatLineIndex: searchToFlatLine,
      searchLineToSectionIndex: searchToSection,
      lineNumberToDisplayRow: lineNumToDisplay,
    };
  }, [sections, expandedSections]);
};
