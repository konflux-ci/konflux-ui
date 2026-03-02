import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LineNumberGutter } from './LineNumberGutter';
import { useLineNumberNavigation } from './useLineNumberNavigation';
import { useVirtualizedScroll } from './useVirtualizedScroll';

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

  const measureCallbackRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const measured = node.offsetHeight;
      if (measured > 0) {
        setItemSize(measured);
      }
    }
  }, []);

  // Initialize virtualizer
  const virtualizer = useVirtualizer<HTMLDivElement, Element>({
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

  // Render a single line with search highlighting (line numbers are in the gutter)
  const renderLine = (line: string, index: number) => {
    // Preserve empty lines by using a non-breaking space
    // This ensures empty lines maintain their height and are visible
    const displayLine = line || '\u00A0';

    // Skip search highlighting if no search text, empty line, or regex unavailable
    if (!line || !searchText || !escapedSearchText || !searchRegex) {
      return <span className="pf-v5-c-log-viewer__text">{displayLine}</span>;
    }

    const parts: string[] = line.split(searchRegex);
    let matchIndexInLine = 1; // PatternFly uses 1-based indexing

    return (
      <span className="pf-v5-c-log-viewer__text">
        {parts.map((part: string, i: number) => {
          // When using split() with a capturing group, matched parts are at odd indices
          if (i % 2 === 1 && part) {
            const isCurrentMatch =
              currentSearchMatch?.rowIndex === index &&
              currentSearchMatch?.matchIndex === matchIndexInLine;
            matchIndexInLine++;
            return (
              <mark
                key={i}
                className={`pf-v5-c-log-viewer__string pf-m-match ${isCurrentMatch ? 'pf-m-current' : ''}`}
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  // Use line number navigation hook
  const { highlightedLines, handleLineClick, isLineHighlighted } = useLineNumberNavigation();

  // Scroll to highlighted lines when hash changes or on initial load
  React.useEffect(() => {
    if (highlightedLines && highlightedLines.start > 0 && lines.length > 0) {
      // Scroll to the start of the highlighted range
      // Convert 1-based line number to 0-based index
      const targetIndex = highlightedLines.start - 1;

      // If target line is out of range, scroll to the last line instead
      // This provides better UX by showing the user where the log ends
      const scrollIndex = targetIndex < lines.length ? targetIndex : lines.length - 1;

      // Wait for next frame to ensure virtualizer is ready after state updates
      let rafId2: number;

      const rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          virtualizer.scrollToIndex(scrollIndex, {
            align: 'center',
            behavior: 'smooth',
          });
        });
      });

      // Cleanup: cancel pending animation frames on unmount or dependency change
      return () => {
        cancelAnimationFrame(rafId1);
        cancelAnimationFrame(rafId2);
      };
    }
    // Depend on both highlightedLines and lines.length to handle initial data load
    // virtualizer reference is stable from useVirtualizer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedLines, lines.length]);

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
              const line = lines[virtualItem.index];
              const lineNumber: number = virtualItem.index + 1;
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
                  {renderLine(line, lineNumber - 1)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
