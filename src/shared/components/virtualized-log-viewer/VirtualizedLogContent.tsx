import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface SearchedWord {
  rowIndex: number;
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
  const prevScrollOffset = React.useRef<number>(0);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [itemSize, setItemSize] = React.useState(20);
  const scrollToIndexRef = React.useRef<number | undefined>(undefined);

  // Split data into lines
  const lines = React.useMemo(() => data.split('\n'), [data]);

  // Pre-compute search regex once for all rows
  const escapedSearchText = React.useMemo(() => {
    if (!searchText || searchText.length < 2) return undefined;
    return searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, [searchText]);

  const searchRegex = React.useMemo(() => {
    if (!escapedSearchText) return undefined;
    return new RegExp(`(${escapedSearchText})`, 'gi');
  }, [escapedSearchText]);

  // Measure actual line height from PatternFly CSS
  React.useEffect(() => {
    if (measureRef.current) {
      const measured = measureRef.current.offsetHeight;
      if (measured > 0 && measured !== itemSize) {
        setItemSize(measured);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemSize,
    overscan: 10,
  });

  // Track scroll offset changes for onScroll callback
  const scrollOffset = virtualizer.scrollOffset ?? 0;

  React.useEffect(() => {
    if (!onScroll) return;

    // Determine scroll direction
    const scrollDirection: 'forward' | 'backward' =
      scrollOffset >= prevScrollOffset.current ? 'forward' : 'backward';

    // scrollUpdateWasRequested is true when scrolling is triggered programmatically
    const scrollUpdateWasRequested = scrollToIndexRef.current !== undefined;

    prevScrollOffset.current = scrollOffset;

    onScroll({
      scrollDirection,
      scrollOffset,
      scrollUpdateWasRequested,
    });
  }, [scrollOffset, onScroll]);

  // Scroll to specific row when scrollToRow changes
  React.useEffect(() => {
    if (scrollToRow !== undefined && scrollToRow > 0) {
      const targetIndex = scrollToRow - 1;
      scrollToIndexRef.current = targetIndex;
      virtualizer.scrollToIndex(targetIndex, { align: 'start' });
    } else {
      // Only clear the flag when scrollToRow becomes undefined/0
      scrollToIndexRef.current = undefined;
    }
  }, [scrollToRow, virtualizer]);

  // Render a single line with search highlighting
  const renderLine = (line: string, index: number) => {
    if (!searchText || searchText.length < 2 || !escapedSearchText || !searchRegex) {
      return <span className="pf-v5-c-log-viewer__text">{line}</span>;
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
        ref={measureRef}
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
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="pf-v5-c-log-viewer__list-item"
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
