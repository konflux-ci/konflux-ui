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

      // Calculate search matches dynamically (not cached) to support search changes without re-tokenization
      const matches = getLineMatches(text, searchRegex);
      const currentMatch =
        currentSearchMatch?.rowIndex === rowIndex
          ? matches[currentSearchMatch.matchIndex - 1] ?? null
          : null;

      // Handle plain text mode (tokens.length === 0)
      // This occurs for: monster lines, empty lines, or tokenization failures
      if (tokens.length === 0) {
        // Empty line: show non-breaking space
        if (!text) {
          return <span className="pf-v5-c-log-viewer__text">{'\u00A0'}</span>;
        }

        // Plain text with search highlighting
        // Render as a single text token with search matches applied
        const rendered = renderTokenRecursive(text, 0, matches, currentMatch, 0);
        return <span className="pf-v5-c-log-viewer__text">{rendered}</span>;
      }

      // Normal mode: render syntax-highlighted tokens with search matches
      let offset = 0;
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
