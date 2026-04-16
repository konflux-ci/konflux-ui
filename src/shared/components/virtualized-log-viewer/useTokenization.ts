import React from 'react';
import Prism from 'prismjs';
import { logger } from '~/monitoring/logger';
import { flattenTokenText } from './log-viewer-utils';
import registerLogSyntax from './refractor-log';
import type { TokenizedLine } from './types';
import type { VirtualLine } from './useLargeLineHandler';

// Register the log language
registerLogSyntax(Prism);

/**
 * Custom hook for lazy tokenization with caching
 * Only tokenizes visible lines and caches results for performance
 *
 * Note: Large lines are already split into 10KB chunks by useLargeLineHandler,
 * so this hook only needs to handle simple on-demand tokenization
 */
export function useTokenization(virtualLines: VirtualLine[]) {
  // Lazy tokenization cache - only tokenize visible lines
  // Cache key: virtualLineIndex -> tokenized line data
  const tokenizationCache = React.useRef<Map<number, TokenizedLine>>(new Map());

  // Clear cache only when data changes
  React.useEffect(() => {
    tokenizationCache.current.clear();
  }, [virtualLines]);

  // Tokenize a single virtual line on-demand with caching
  const tokenizeLine = React.useCallback(
    (virtualLineIndex: number): TokenizedLine => {
      // Check cache first
      const cached = tokenizationCache.current.get(virtualLineIndex);
      if (cached) return cached;

      // Get the virtual line
      const virtualLine = virtualLines[virtualLineIndex];
      if (!virtualLine || !virtualLine.text) {
        const result = { tokens: [], text: '' };
        tokenizationCache.current.set(virtualLineIndex, result);
        return result;
      }

      const { text } = virtualLine;

      // Tokenize and cache with performance monitoring
      try {
        const startTime = process.env.NODE_ENV !== 'production' ? performance.now() : 0;

        const tokens = Prism.tokenize(text, Prism.languages.log);
        const flatText = tokens.map(flattenTokenText).join('');
        const result = { tokens, text: flatText };
        tokenizationCache.current.set(virtualLineIndex, result);

        // Log performance warning for slow tokenization
        if (process.env.NODE_ENV !== 'production') {
          const duration = performance.now() - startTime;
          if (duration > 50) {
            logger.warn(
              `Slow tokenization: ${duration.toFixed(2)}ms for virtual line ${virtualLineIndex} (${text.length} chars)`,
            );
          }
        }

        return result;
      } catch (error) {
        logger.error('Prism tokenization failed', error as Error, {
          virtualLineIndex,
          textLength: text.length,
        });
        const result = { tokens: [], text };
        tokenizationCache.current.set(virtualLineIndex, result);
        return result;
      }
    },
    [virtualLines],
  );

  return { tokenizeLine };
}
