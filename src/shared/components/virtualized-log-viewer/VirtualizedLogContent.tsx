import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LineNumberGutter } from './LineNumberGutter';
import Prism from './prism-log-language';
import { useLineNumberNavigation } from './useLineNumberNavigation';
import { useVirtualizedScroll } from './useVirtualizedScroll';
import './prism-log-theme.scss';

/** Recursively flattens nested Prism tokens into plain text */
function flattenTokenText(token: string | Prism.Token): string {
  if (typeof token === 'string') return token;
  if (Array.isArray(token.content)) return token.content.map(flattenTokenText).join('');
  return flattenTokenText(token.content);
}

/** Finds all search pattern matches in a line and returns their positions */
function getLineMatches(lineText: string, regex: RegExp | undefined) {
  if (!regex) return [];
  const matches: { start: number; end: number }[] = [];
  for (const match of lineText.matchAll(regex)) {
    if (match.index !== undefined)
      matches.push({ start: match.index, end: match.index + match[0].length });
  }
  return matches;
}

/** Checks if a range overlaps with the currently selected search match */
function isMatchCurrent(
  start: number,
  end: number,
  currentMatch: { start: number; end: number } | null,
) {
  return currentMatch !== null && start < currentMatch.end && end > currentMatch.start;
}

export interface SearchedWord {
  /** Zero-based row index of the match */
  rowIndex: number;
  /** Match index within the row (1-based, following PatternFly convention) */
  matchIndex: number;
}

export interface VirtualizedLogContentProps {
  data: string;
  height: number;
  width: string | number;
  scrollToRow?: number;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
  searchText?: string;
  currentSearchMatch?: SearchedWord;
}

type TokenizedLine = {
  tokens: (string | Prism.Token)[];
  text: string;
} | null;

export const VirtualizedLogContent: React.FC<VirtualizedLogContentProps> = ({
  data,
  height,
  width,
  scrollToRow,
  onScroll,
  searchText = '',
  currentSearchMatch,
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [itemSize, setItemSize] = React.useState(20);

  // Split data into lines
  const lines = React.useMemo(() => data.split('\n'), [data]);

  // Suppress harmless ResizeObserver error from @tanstack/react-virtual
  // This is a known browser limitation when virtualizer measures elements during fullscreen toggle
  // https://github.com/WICG/resize-observer/issues/38
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
        event.message?.includes('ResizeObserver loop limit exceeded')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    };

    // Use capture phase to catch errors earlier
    window.addEventListener('error', handleError, { capture: true });
    return () => window.removeEventListener('error', handleError, { capture: true });
  }, []);

  // Pre-compute search regex once for all rows
  const escapedSearchText = React.useMemo(() => {
    if (!searchText) return undefined;
    return searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, [searchText]);

  const searchRegex = React.useMemo(() => {
    if (!escapedSearchText) return undefined;
    return new RegExp(`(${escapedSearchText})`, 'gi');
  }, [escapedSearchText]);

  // Lazy tokenization cache - only tokenize visible lines
  // Cache key: lineIndex -> tokenized line data (tokens and text only, NOT matches)
  const tokenizationCache = React.useRef<Map<number, TokenizedLine>>(new Map());

  // Clear cache only when data changes (NOT when search changes, as tokens remain the same)
  React.useEffect(() => {
    tokenizationCache.current.clear();
  }, [data]);

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

  const measureCallbackRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const measured = node.offsetHeight;
      if (measured > 0) {
        setItemSize(measured);
      }
    }
  }, []);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemSize,
    overscan: 10,
  });

  // Handle scroll behavior (direction, programmatic scroll, scrollToRow)
  useVirtualizedScroll({
    virtualizer,
    scrollToRow,
    onScroll,
  });

  // Render string token with highlights
  const renderTokenString = React.useCallback(
    (
      tokenStr: string,
      tokenStart: number,
      lineMatches: { start: number; end: number }[],
      currentMatch: { start: number; end: number } | null,
    ) => {
      const pieces: React.ReactNode[] = [];
      let idx = 0;
      for (const match of lineMatches) {
        if (match.end <= tokenStart + idx) continue;
        if (match.start >= tokenStart + tokenStr.length) break;
        const startInToken = Math.max(match.start - tokenStart, 0);
        const endInToken = Math.min(match.end - tokenStart, tokenStr.length);

        if (startInToken > idx)
          pieces.push(<span key={`text-${idx}`}>{tokenStr.slice(idx, startInToken)}</span>);

        const isCurrent = isMatchCurrent(
          tokenStart + startInToken,
          tokenStart + endInToken,
          currentMatch,
        );

        pieces.push(
          <mark
            key={`mark-${startInToken}`}
            className={`pf-v5-c-log-viewer__string pf-m-match ${isCurrent ? 'pf-m-current' : ''}`}
          >
            {tokenStr.slice(startInToken, endInToken)}
          </mark>,
        );

        idx = endInToken;
      }
      if (idx < tokenStr.length)
        pieces.push(<span key={`text-${idx}`}>{tokenStr.slice(idx)}</span>);
      return pieces;
    },
    [],
  );

  // Recursive rendering of Prism tokens
  const renderTokenRecursive = React.useCallback(
    (
      token: string | Prism.Token,
      tokenStart: number,
      lineMatches: { start: number; end: number }[],
      currentMatch: { start: number; end: number } | null,
      key: number,
      depth = 0,
    ): React.ReactNode => {
      if (depth > 50) return <span key={key}>...</span>;
      if (typeof token === 'string')
        return renderTokenString(token, tokenStart, lineMatches, currentMatch);

      const tokenType = Array.isArray(token.type) ? token.type.join(' ') : token.type;
      const children = Array.isArray(token.content)
        ? token.content.map((t, i) =>
            renderTokenRecursive(t, tokenStart, lineMatches, currentMatch, i, depth + 1),
          )
        : renderTokenRecursive(token.content, tokenStart, lineMatches, currentMatch, 0, depth + 1);

      return (
        <span key={key} className={`token ${tokenType}`}>
          {children}
        </span>
      );
    },
    [renderTokenString],
  );

  // Render a single line with lazy tokenization
  const renderLine = React.useCallback(
    (rowIndex: number) => {
      const lineObj = tokenizeLine(rowIndex);
      if (!lineObj) return <span className="pf-v5-c-log-viewer__text">&nbsp;</span>;

      const { tokens, text } = lineObj;
      if (tokens.length === 0) {
        return <span className="pf-v5-c-log-viewer__text">&nbsp;</span>;
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
    [tokenizeLine, currentSearchMatch, renderTokenRecursive, searchRegex],
  );

  // Use line number navigation hook
  const { highlightedLines, handleLineClick, isLineHighlighted } = useLineNumberNavigation();

  // Scroll to highlighted lines when hash changes or on initial load
  React.useEffect(() => {
    if (highlightedLines && highlightedLines.start > 0) {
      // Scroll to the start of the highlighted range
      // Convert 1-based line number to 0-based index
      const targetIndex = highlightedLines.start - 1;

      // Wait for next frame to ensure virtualizer is ready after state updates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          virtualizer.scrollToIndex(targetIndex, {
            align: 'center',
            behavior: 'smooth',
          });
        });
      });
    }
    // Only depend on highlightedLines to avoid infinite loops
    // virtualizer reference is stable from useVirtualizer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedLines]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <>
      {/* Hidden element to measure actual line height from PatternFly CSS */}
      <div
        ref={measureCallbackRef}
        className="pf-v5-c-log-viewer__list-item"
        style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
      >
        <span className="pf-v5-c-log-viewer__text">M</span>
      </div>

      {/* Scrollable container with gutter */}
      <div
        ref={parentRef}
        className="pf-v5-c-log-viewer__list log-viewer__with-gutter"
        style={{
          height: `${height}px`,
          width: typeof width === 'number' ? `${width}px` : width,
          overflow: 'auto',
        }}
      >
        {/* Total height container */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
            display: 'flex',
          }}
        >
          {/* Line number gutter */}
          <LineNumberGutter
            virtualItems={virtualItems}
            itemSize={itemSize}
            onLineClick={handleLineClick}
            isLineHighlighted={isLineHighlighted}
          />

          {/* Log content */}
          <div className="log-viewer__content-column">
            {virtualItems.map((virtualItem) => {
              const lineNumber = virtualItem.index + 1;
              const isHighlighted = isLineHighlighted(lineNumber);
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className={`pf-v5-c-log-viewer__list-item ${isHighlighted ? 'log-viewer__line--highlighted' : ''}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {renderLine(virtualItem.index)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
