import React from 'react';
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';
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
  selectedLines?: { start: number; end: number } | null;
  onVirtualizerReady?: (virtualizer: Virtualizer<HTMLDivElement, Element>) => void;
}

export const VirtualizedLogContent: React.FC<VirtualizedLogContentProps> = ({
  data,
  height,
  width,
  scrollToRow,
  onScroll,
  searchText = '',
  currentSearchMatch,
  selectedLines,
  onVirtualizerReady,
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
    if (!searchText || searchText.length < 2) return undefined;
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
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemSize,
    overscan: 10,
  });

  // Notify parent of virtualizer instance for line number gutter sync (only once on mount)
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      onVirtualizerReady?.(virtualizer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle scroll behavior (direction, programmatic scroll, scrollToRow)
  useVirtualizedScroll({
    virtualizer,
    scrollToRow,
    onScroll,
  });

  // Render a single line with search highlighting
  const renderLine = (line: string, index: number) => {
    // Preserve empty lines by using a non-breaking space
    // This ensures empty lines maintain their height and are visible
    const displayLine = line || '\u00A0';

    if (!searchText || searchText.length < 2 || !escapedSearchText || !searchRegex) {
      return <span className="pf-v5-c-log-viewer__text">{displayLine}</span>;
    }

    // For empty lines, don't run search - just return the non-breaking space
    if (!line) {
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

      {/* Scrollable container */}
      <div
        ref={parentRef}
        className="pf-v5-c-log-viewer__list"
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
          }}
        >
          {/* Visible items */}
          {virtualItems.map((virtualItem) => {
            const line = lines[virtualItem.index];
            const lineNumber = virtualItem.index + 1;
            const isLineSelected =
              selectedLines && lineNumber >= selectedLines.start && lineNumber <= selectedLines.end;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className={`pf-v5-c-log-viewer__list-item ${isLineSelected ? 'log-viewer__line--selected' : ''}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {renderLine(line, virtualItem.index)}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
