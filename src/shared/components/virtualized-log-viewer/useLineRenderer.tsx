import React from 'react';
import { flattenTokenText, getLineMatches } from './log-viewer-utils';
import { renderTokenRecursive } from './token-renderer';
import type { SearchedWord, TokenizedLine } from './types';

interface UseLineRendererParams {
  tokenizeLine: (lineIndex: number) => TokenizedLine;
  searchRegex: RegExp | undefined;
  currentSearchMatch?: SearchedWord;
}

/**
 * Custom hook that provides a line rendering function
 * Handles tokenization, search highlighting, and rendering of individual log lines
 */
export function useLineRenderer({
  tokenizeLine,
  searchRegex,
  currentSearchMatch,
}: UseLineRendererParams) {
  const renderLine = React.useCallback(
    (rowIndex: number) => {
      const lineObj = tokenizeLine(rowIndex);
      if (!lineObj) return <span className="pf-v5-c-log-viewer__text">&nbsp;</span>;

      const { tokens, text } = lineObj;
      if (tokens.length === 0) {
        // Preserve raw text when tokenization fails, only show &nbsp; for truly empty lines
        return <span className="pf-v5-c-log-viewer__text">{text || '\u00A0'}</span>;
      }

      // Calculate matches dynamically (not cached) to support search changes without re-tokenization
      const matches = getLineMatches(text, searchRegex);
      let offset = 0;
      const currentMatch =
        currentSearchMatch?.rowIndex === rowIndex
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
    [tokenizeLine, currentSearchMatch, searchRegex],
  );

  return renderLine;
}
