import React from 'react';
import { flattenTokenText, getLineMatches } from './log-viewer-utils';
import { renderTokenRecursive } from './token-renderer';
import type { SearchedWord, TokenizedLine } from './types';
import { type VirtualLine } from './useLargeLineHandler';

interface UseLineRendererParams {
  tokenizeLine: (virtualLineIndex: number) => TokenizedLine;
  searchRegex: RegExp | undefined;
  currentSearchMatch?: SearchedWord;
  virtualLines: VirtualLine[];
}

/**
 * Custom hook that provides a line rendering function
 * Handles tokenization, search highlighting, and rendering of individual log lines
 */
export function useLineRenderer({
  tokenizeLine,
  searchRegex,
  currentSearchMatch,
  virtualLines,
}: UseLineRendererParams) {
  const renderLine = React.useCallback(
    (virtualLineIndex: number) => {
      const virtualLine = virtualLines[virtualLineIndex];
      if (!virtualLine) return <span className="pf-v5-c-log-viewer__text">&nbsp;</span>;

      const lineObj = tokenizeLine(virtualLineIndex);
      if (!lineObj) return <span className="pf-v5-c-log-viewer__text">&nbsp;</span>;

      const { tokens, text } = lineObj;
      if (tokens.length === 0) {
        // Preserve raw text when tokenization fails, only show &nbsp; for truly empty lines
        return <span className="pf-v5-c-log-viewer__text">{text || '\u00A0'}</span>;
      }

      // Calculate matches dynamically (not cached) to support search changes without re-tokenization
      const matches = getLineMatches(text, searchRegex);
      let offset = 0;

      // Check if this virtual line should show the current search match
      // currentSearchMatch.rowIndex is now the virtual line index (0-based)
      const currentMatch =
        currentSearchMatch?.rowIndex === virtualLineIndex
          ? matches[currentSearchMatch.matchIndex - 1] ?? null
          : null;

      return (
        <span className="pf-v5-c-log-viewer__text">
          {tokens.map((t, i) => {
            const rendered = renderTokenRecursive(t, offset, matches, currentMatch, i);
            offset += flattenTokenText(t).length;
            return rendered;
          })}
        </span>
      );
    },
    [tokenizeLine, currentSearchMatch, searchRegex, virtualLines],
  );

  return renderLine;
}
