import React from 'react';
import Prism from 'prismjs';
import { logger } from '~/monitoring/logger';
import { flattenTokenText } from './log-viewer-utils';
import registerLogSyntax from './refractor-log';
import type { TokenizedLine } from './types';

// Register the log language
registerLogSyntax(Prism);

// Threshold for disabling syntax highlighting (30KB) to ensure a 50ms
// "Safe Rendering" window and prevent UI micro-freezes during initial load and fast scrolling.
// Lines larger than this will be rendered as plain text for performance
export const MONSTER_LINE_THRESHOLD = 30 * 1024;

/**
 * Custom hook for lazy tokenization with caching
 * Only tokenizes visible lines and caches results for performance
 */
export function useTokenization(lines: string[]) {
  // Lazy tokenization cache - only tokenize visible lines
  // Cache key: line content -> tokenized line data (tokens and text only, NOT matches)
  const tokenizationCache = React.useRef<Map<string, TokenizedLine>>(new Map());

  // Tokenize a single line on-demand with caching
  const tokenizeLine = React.useCallback(
    (lineIndex: number): TokenizedLine => {
      // Get the line text
      const line = lines[lineIndex];

      // Check cache first
      const cached = tokenizationCache.current.get(line);
      if (cached) return cached;

      if (!line) {
        const result = { tokens: [], text: '' };
        tokenizationCache.current.set('', result);
        return result;
      }

      // Tiered highlighting strategy based on line length:
      // - Normal (< 30KB): Full Prism syntax highlighting
      // - Monster (>= 30KB): Plain text only (skip Prism for performance)
      const lineLength = line.length;

      if (lineLength >= MONSTER_LINE_THRESHOLD) {
        // Monster line: render as plain text without syntax highlighting
        const result = { tokens: [], text: line };
        tokenizationCache.current.set(line, result);
        return result;
      }

      // Normal line: apply full Prism tokenization
      try {
        const startTime = process.env.NODE_ENV !== 'production' ? performance.now() : 0;

        const tokens = Prism.tokenize(line, Prism.languages.log);
        const text = tokens.map(flattenTokenText).join('');
        const result = { tokens, text };
        tokenizationCache.current.set(line, result);

        // Log performance warning for slow tokenization
        if (process.env.NODE_ENV !== 'production') {
          const duration = performance.now() - startTime;
          if (duration > 50) {
            logger.warn(
              `Slow tokenization: ${duration.toFixed(2)}ms for line ${lineIndex} (${lineLength} chars)`,
            );
          }
        }

        return result;
      } catch (error) {
        logger.error('Prism tokenization failed', error as Error, {
          lineIndex,
          lineLength,
        });
        // Fallback to plain text on error
        const result = { tokens: [], text: line };
        tokenizationCache.current.set(line, result);
        return result;
      }
    },
    [lines],
  );

  return { tokenizeLine };
}
