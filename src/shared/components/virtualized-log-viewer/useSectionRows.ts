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

const EMPTY_SEARCH_MAP = new Map<number, number>();
const EMPTY_SECTION_ROWS: SectionRowsResult = {
  displayRows: [],
  allLines: [],
  searchLineToDisplayRow: EMPTY_SEARCH_MAP,
  searchLineToFlatLineIndex: EMPTY_SEARCH_MAP,
  searchLineToSectionIndex: EMPTY_SEARCH_MAP,
  lineNumberToDisplayRow: EMPTY_SEARCH_MAP,
};

export const useSectionRows = (
  sections: readonly LogSection[],
  expandedSections: Set<number>,
): SectionRowsResult => {
  const normalizedSections = React.useMemo(
    () =>
      sections.length === 0
        ? []
        : sections.map((s) => ({
            containerName: s.containerName,
            lines: normalizeLogLines(s.data),
          })),
    [sections],
  );

  const allLines = React.useMemo(
    () => normalizedSections.flatMap((s) => s.lines),
    [normalizedSections],
  );

  return React.useMemo(() => {
    if (normalizedSections.length === 0) return EMPTY_SECTION_ROWS;
    const rows: LogDisplayRow[] = [];
    const searchToDisplay = new Map<number, number>();
    const searchToFlatLine = new Map<number, number>();
    const searchToSection = new Map<number, number>();
    const lineNumToDisplay = new Map<number, number>();

    let globalLineNumber = 1;
    let flatLineIndex = 0;
    let searchLine = 0;

    for (let i = 0; i < normalizedSections.length; i++) {
      const { containerName, lines: sectionLines } = normalizedSections[i];
      const isExpanded = expandedSections.has(i);

      const headerDisplayIdx = rows.length;
      rows.push({
        kind: 'section-header',
        sectionName: containerName,
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

      if (i < normalizedSections.length - 1) {
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
  }, [normalizedSections, allLines, expandedSections]);
};
