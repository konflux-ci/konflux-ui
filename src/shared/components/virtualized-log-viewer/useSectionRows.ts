import React from 'react';
import type { LogDisplayRow, NormalizedLogSection } from './types';

export interface SectionRowsResult {
  displayRows: LogDisplayRow[];
  allLines: string[];
  searchLineToDisplayRow: Map<number, number>;
  /** Search line index (toolbar) → flat content line index for highlighting */
  searchLineToFlatLineIndex: Map<number, number>;
  /** Search line index → section index (used to expand folded steps before scroll) */
  searchLineToSectionIndex: Map<number, number>;
  /** Global line number → section index (used to expand folded steps for URL hash navigation) */
  lineNumberToSectionIndex: Map<number, number>;
  lineNumberToDisplayRow: Map<number, number>;
}

const EMPTY_SEARCH_MAP = new Map<number, number>();
const EMPTY_SECTION_ROWS: SectionRowsResult = {
  displayRows: [],
  allLines: [],
  searchLineToDisplayRow: EMPTY_SEARCH_MAP,
  searchLineToFlatLineIndex: EMPTY_SEARCH_MAP,
  searchLineToSectionIndex: EMPTY_SEARCH_MAP,
  lineNumberToSectionIndex: EMPTY_SEARCH_MAP,
  lineNumberToDisplayRow: EMPTY_SEARCH_MAP,
};

export const useSectionRows = (
  sections: readonly NormalizedLogSection[],
  expandedSections: Set<number>,
): SectionRowsResult => {
  const allLines = React.useMemo(() => sections.flatMap((s) => s.lines), [sections]);

  return React.useMemo(() => {
    if (sections.length === 0) return EMPTY_SECTION_ROWS;
    const rows: LogDisplayRow[] = [];
    const searchToDisplay = new Map<number, number>();
    const searchToFlatLine = new Map<number, number>();
    const searchToSection = new Map<number, number>();
    const lineNumToSection = new Map<number, number>();
    const lineNumToDisplay = new Map<number, number>();

    let globalLineNumber = 1;
    let flatLineIndex = 0;
    let searchLine = 0;

    for (let i = 0; i < sections.length; i++) {
      const { containerName, lines: sectionLines, error: sectionError } = sections[i];
      const isExpanded = expandedSections.has(i);

      const headerDisplayIdx = rows.length;
      rows.push({
        kind: 'section-header',
        sectionName: containerName,
        sectionIndex: i,
        lineNumber: globalLineNumber,
        lineCount: sectionLines.length,
        isExpanded,
        error: sectionError,
      });
      searchToDisplay.set(searchLine, headerDisplayIdx);
      searchToSection.set(searchLine, i);
      lineNumToDisplay.set(globalLineNumber, headerDisplayIdx);
      lineNumToSection.set(globalLineNumber, i);
      searchLine++;
      globalLineNumber++;

      for (let j = 0; j < sectionLines.length; j++) {
        searchToFlatLine.set(searchLine + j, flatLineIndex + j);
        searchToSection.set(searchLine + j, i);
        lineNumToSection.set(globalLineNumber + j, i);
      }

      if (isExpanded) {
        if (sectionError) {
          // Surface the error inline in the body too, right where the section's content would
          // otherwise start -- the header icon/tooltip alone is easy to miss, especially when
          // the section has no log lines at all to draw attention to it.
          rows.push({ kind: 'section-error', sectionIndex: i, error: sectionError });
        }

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
      lineNumberToSectionIndex: lineNumToSection,
      lineNumberToDisplayRow: lineNumToDisplay,
    };
  }, [sections, allLines, expandedSections]);
};
