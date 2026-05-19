import React from 'react';
import { ANSI_ESCAPE_REGEX } from './log-viewer-utils';
import type { LogDisplayRow, LogSection } from './types';

export interface SectionRowsResult {
  /** Flat display-row list for the virtualizer (changes with fold state) */
  displayRows: LogDisplayRow[];
  /**
   * All content lines from every section, in order — stable across fold/unfold.
   * This is the input for useTokenization so Prism doesn't retokenise on toggle.
   */
  allLines: string[];
  /**
   * Maps a 0-indexed position in the joined search-data string to the
   * display-row index of the matching visible row.
   * Missing entry = the line is a name/separator OR is inside a collapsed section.
   */
  searchLineToDisplayRow: Map<number, number>;
  /**
   * Maps a 0-indexed search-data line to its owning section index.
   * Used to auto-expand a collapsed section when a search result lands inside it.
   */
  searchLineToSection: Map<number, number>;
  /**
   * Maps a global (continuous) line number to its display-row index.
   * Only content rows that are currently visible have entries.
   */
  lineNumberToDisplayRow: Map<number, number>;
}

/**
 * Pure data-transform hook.
 *
 * The search context uses a joined string built by LogViewer:
 *   sections.map(s => `${s.name.toUpperCase()}\n${s.data}`).join('\n\n')
 * which produces search-line positions:
 *   [section-name, ...content-lines, separator?, section-name, ...]
 *
 * This hook builds the index maps so VirtualizedLogContent can translate
 * a scrollToRow from that search space into a display-row index.
 */
export const useSectionRows = (
  sections: readonly LogSection[],
  expandedSections: Set<number>,
): SectionRowsResult => {
  // allLines is stable across fold/unfold — only recomputes when log data changes
  const allLines = React.useMemo(() => {
    const result: string[] = [];
    for (const section of sections) {
      const clean = section.data.replace(/\r/g, '\n').replace(ANSI_ESCAPE_REGEX, '');
      result.push(...clean.split('\n'));
    }
    return result;
  }, [sections]);

  // Per-section cleaned line arrays — reused by displayRows to avoid double-processing
  const processedSections = React.useMemo(
    () =>
      sections.map((s) => s.data.replace(/\r/g, '\n').replace(ANSI_ESCAPE_REGEX, '').split('\n')),
    [sections],
  );

  const { displayRows, searchLineToDisplayRow, searchLineToSection, lineNumberToDisplayRow } =
    React.useMemo(() => {
      const rows: LogDisplayRow[] = [];
      const searchToDisplay = new Map<number, number>();
      const searchToSection = new Map<number, number>();
      const lineNumToDisplay = new Map<number, number>();

      let globalLineNumber = 1;
      let flatLineIndex = 0;
      // Position in the joined search string:
      //   section-name line, content lines..., separator (empty line), next section...
      let searchLine = 0;

      for (let i = 0; i < sections.length; i++) {
        const lines = processedSections[i];
        const isExpanded = expandedSections.has(i);

        // Section header row
        const headerDisplayIdx = rows.length;
        rows.push({
          kind: 'section-header',
          sectionName: sections[i].name,
          sectionIndex: i,
          lineNumber: globalLineNumber,
          lineCount: lines.length,
          isExpanded,
        });
        // The section name occupies one search line
        searchToDisplay.set(searchLine, headerDisplayIdx);
        searchLine++;
        globalLineNumber++;

        if (isExpanded) {
          for (let j = 0; j < lines.length; j++) {
            const contentDisplayIdx = rows.length;
            rows.push({
              kind: 'content',
              globalLineNumber,
              flatLineIndex,
              sectionIndex: i,
            });
            searchToDisplay.set(searchLine, contentDisplayIdx);
            searchToSection.set(searchLine, i);
            lineNumToDisplay.set(globalLineNumber, contentDisplayIdx);
            searchLine++;
            globalLineNumber++;
            flatLineIndex++;
          }
        } else {
          // Collapsed: show fold-indicator, advance counters without adding content rows
          rows.push({ kind: 'fold-indicator', sectionIndex: i, lineCount: lines.length });
          for (let j = 0; j < lines.length; j++) {
            searchToSection.set(searchLine, i);
            searchLine++;
          }
          globalLineNumber += lines.length;
          flatLineIndex += lines.length;
        }

        // Separator between sections (one empty line in the search string)
        if (i < sections.length - 1) {
          searchLine++;
        }
      }

      return {
        displayRows: rows,
        searchLineToDisplayRow: searchToDisplay,
        searchLineToSection: searchToSection,
        lineNumberToDisplayRow: lineNumToDisplay,
      };
    }, [sections, expandedSections, processedSections]);

  return {
    displayRows,
    allLines,
    searchLineToDisplayRow,
    searchLineToSection,
    lineNumberToDisplayRow,
  };
};
