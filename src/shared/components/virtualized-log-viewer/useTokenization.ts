import React from 'react';
import { flattenTokenText } from './log-viewer-utils';
import Prism from './prism-log-language';
import type { TokenizedLine } from './types';

/**
 * Custom hook for lazy tokenization with caching
 * Only tokenizes visible lines and caches results for performance
 */
export function useTokenization(lines: string[]) {
  // Lazy tokenization cache - only tokenize visible lines
  // Cache key: lineIndex -> tokenized line data (tokens and text only, NOT matches)
  const tokenizationCache = React.useRef<Map<number, TokenizedLine>>(new Map());

  // Clear cache only when data changes (NOT when search changes, as tokens remain the same)
  React.useEffect(() => {
    tokenizationCache.current.clear();
  }, [lines]);

  // Tokenize a single line on-demand with caching
  const tokenizeLine = React.useCallback(
    (lineIndex: number): TokenizedLine => {
      // Check cache first
      const cached = tokenizationCache.current.get(lineIndex);
      if (cached) return cached;

      // Get the line text
      const line = lines[lineIndex];
      if (!line) {
        const result = { tokens: [], text: '' };
        tokenizationCache.current.set(lineIndex, result);
        return result;
      }

      // Tokenize and cache with performance monitoring
      try {
        const startTime = process.env.NODE_ENV !== 'production' ? performance.now() : 0;

        const tokens = Prism.tokenize(line, Prism.languages.log);
        const text = tokens.map(flattenTokenText).join('');
        const result = { tokens, text };
        tokenizationCache.current.set(lineIndex, result);

        // Log performance warning for slow tokenization in non-production
        if (process.env.NODE_ENV !== 'production') {
          const duration = performance.now() - startTime;
          if (duration > 50) {
            // eslint-disable-next-line no-console
            console.warn(
              `Slow tokenization: ${duration.toFixed(2)}ms for line ${lineIndex} (${line.length} chars)`,
            );
          }
        }

        return result;
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('Prism tokenization failed for line', lineIndex, error);
        }
        const result = { tokens: [], text: line };
        tokenizationCache.current.set(lineIndex, result);
        return result;
      }
    },
    [lines],
  );

  return { tokenizeLine };
}
