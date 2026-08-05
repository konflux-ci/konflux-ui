import React from 'react';
import type { LogDisplayRow, NormalizedLogSection } from './types';

export interface SectionRowsResult {
  displayRows: LogDisplayRow[];
  allLines: string[];
  lineNumberToSectionIndex: Map<number, number>;
  lineNumberToDisplayRow: Map<number, number>;
  flatLineIndexToDisplayRow: Map<number, number>;
}

const EMPTY_MAP = new Map<number, number>();
const EMPTY_SECTION_ROWS: SectionRowsResult = {
  displayRows: [],
  allLines: [],
  lineNumberToSectionIndex: EMPTY_MAP,
  lineNumberToDisplayRow: EMPTY_MAP,
  flatLineIndexToDisplayRow: EMPTY_MAP,
};

export const useSectionRows = (
  sections: readonly NormalizedLogSection[],
  expandedSections: Set<number>,
): SectionRowsResult => {
  const allLines = React.useMemo(() => sections.flatMap((s) => s.lines), [sections]);

  return React.useMemo(() => {
    if (sections.length === 0) return EMPTY_SECTION_ROWS;
    const rows: LogDisplayRow[] = [];
    const lineNumToSection = new Map<number, number>();
    const lineNumToDisplay = new Map<number, number>();
    const flatIdxToDisplay = new Map<number, number>();

    let globalLineNumber = 1;
    let flatLineIndex = 0;

    for (let i = 0; i < sections.length; i++) {
      const { containerName, lines: sectionLines } = sections[i];
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
      lineNumToDisplay.set(globalLineNumber, headerDisplayIdx);
      lineNumToSection.set(globalLineNumber, i);
      globalLineNumber++;

      for (let j = 0; j < sectionLines.length; j++) {
        lineNumToSection.set(globalLineNumber + j, i);
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
          lineNumToDisplay.set(globalLineNumber + j, contentDisplayIdx);
          flatIdxToDisplay.set(flatLineIndex + j, contentDisplayIdx);
        }
      } else {
        rows.push({ kind: 'fold-indicator', sectionIndex: i, lineCount: sectionLines.length });
      }

      globalLineNumber += sectionLines.length;
      flatLineIndex += sectionLines.length;
    }

    return {
      displayRows: rows,
      allLines,
      lineNumberToSectionIndex: lineNumToSection,
      lineNumberToDisplayRow: lineNumToDisplay,
      flatLineIndexToDisplayRow: flatIdxToDisplay,
    };
  }, [sections, allLines, expandedSections]);
};
