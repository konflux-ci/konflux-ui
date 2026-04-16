import React from 'react';
import { logger } from '~/monitoring/logger';
import { tokenizeLine as tokenizeLineCore } from './tokenize-core';
import type { TokenizedLine } from './types';
import { useTokenizationWorker } from './useTokenizationWorker';
// Import SCSS styles for log syntax highlighting (main thread only)
import './refractor-log.scss';

// Threshold for using Web Worker (50KB)
// Lines >= 50KB will be tokenized in a worker to avoid blocking the main thread
const MONSTER_LINE_THRESHOLD = 50 * 1024;

/**
 * Custom hook for lazy tokenization with caching
 *
 * Strategy:
 * - Normal lines (< 50KB): Tokenize on main thread (fast, synchronous)
 * - Monster lines (>= 50KB): Offload to Web Worker (non-blocking, async)
 *
 * This keeps the UI responsive even when dealing with very large log lines.
 */
export function useTokenization(lines: string[]) {
  // Lazy tokenization cache - only tokenize visible lines
  // Cache key: lineIndex -> tokenized line data (tokens and text only, NOT matches)
  const tokenizationCache = React.useRef<Map<number, TokenizedLine>>(new Map());

  // Track pending worker requests to avoid duplicate work
  const pendingWorkerRequests = React.useRef<Map<number, Promise<TokenizedLine>>>(new Map());

  // Force re-render when worker completes tokenization
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Worker hook for monster lines
  const { tokenizeWithWorker, isWorkerAvailable } = useTokenizationWorker();

  // Clear cache only when data changes (NOT when search changes, as tokens remain the same)
  React.useEffect(() => {
    tokenizationCache.current.clear();
    pendingWorkerRequests.current.clear();
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

      const lineLength = line.length;

      // Monster line (>= 50KB): Use Web Worker if available
      if (lineLength >= MONSTER_LINE_THRESHOLD && isWorkerAvailable) {
        // Check if there's already a pending request for this line
        const pending = pendingWorkerRequests.current.get(lineIndex);
        if (pending) {
          // Return placeholder while worker is processing
          return { tokens: [], text: line };
        }

        // Start worker tokenization (async)
        const workerPromise = tokenizeWithWorker(line, lineIndex)
          .then((response) => {
            const result = { tokens: response.tokens, text: response.text };
            tokenizationCache.current.set(lineIndex, result);
            pendingWorkerRequests.current.delete(lineIndex);
            // Trigger re-render to show the tokenized result
            forceUpdate();
            return result;
          })
          .catch((error) => {
            logger.warn('Worker tokenization failed, using plain text', {
              errorMessage: error instanceof Error ? error.message : String(error),
              lineIndex,
            });
            const result = { tokens: [], text: line };
            tokenizationCache.current.set(lineIndex, result);
            pendingWorkerRequests.current.delete(lineIndex);
            // Trigger re-render to show the fallback
            forceUpdate();
            return result;
          });

        pendingWorkerRequests.current.set(lineIndex, workerPromise);

        // Return plain text placeholder immediately (worker will update cache when done)
        return { tokens: [], text: line };
      }

      // Normal line (< 50KB) OR worker not available: Tokenize on main thread
      // Reuse the same core tokenization logic
      try {
        const startTime = process.env.NODE_ENV !== 'production' ? performance.now() : 0;

        const result = tokenizeLineCore(line);
        tokenizationCache.current.set(lineIndex, result);

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
        const result = { tokens: [], text: line };
        tokenizationCache.current.set(lineIndex, result);
        return result;
      }
    },
    [lines, isWorkerAvailable, tokenizeWithWorker],
  );

  return { tokenizeLine };
}
