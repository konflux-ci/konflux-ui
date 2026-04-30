import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LineNumberGutter } from './LineNumberGutter';
import type { SearchedWord, LogSection } from './types';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { useLineNumberNavigation } from './useLineNumberNavigation';
import { useLineRenderer } from './useLineRenderer';
import { useResizeObserverFix } from './useResizeObserverFix';
import { useSearchRegex } from './useSearchRegex';
import { useTokenization } from './useTokenization';
import { useVirtualizedScroll } from './useVirtualizedScroll';
import {
  VIRTUALIZATION_CONFIG,
  getOverscanCount,
  getSafetyMargin,
  measureAverageCharWidth,
  calculateCharsPerLine,
} from './virtualization-utils';

import './VirtualizedLogContent.scss';

type LogVirtualItem =
  | {
      type: 'header';
      containerName: string;
    }
  | {
      type: 'line';
      text: string;
    };

const buildFlatItems = (sections: LogSection[]): LogVirtualItem[] => {
  const items: LogVirtualItem[] = [];
  for (const section of sections) {
    items.push({ type: 'header', containerName: section.containerName });
    for (const line of section.lines) {
      items.push({ type: 'line', text: line });
    }
  }
  return items;
};

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
  sections?: LogSection[];
}

export const VirtualizedLogContent: React.FC<VirtualizedLogContentProps> = ({
  data,
  height,
  width,
  scrollToRow,
  onScroll,
  searchText = '',
  currentSearchMatch,
  sections,
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [itemSize, setItemSize] = React.useState(VIRTUALIZATION_CONFIG.FALLBACK_LINE_HEIGHT);
  // Fallback values for when DOM measurement is unavailable (SSR, Canvas API failure, etc.)
  const avgCharWidthRef = React.useRef(VIRTUALIZATION_CONFIG.FALLBACK_CHAR_WIDTH);
  const charsPerLineRef = React.useRef(VIRTUALIZATION_CONFIG.FALLBACK_CHARS_PER_LINE);

  const flatItems = React.useMemo(
    () => (sections ? buildFlatItems(sections) : undefined),
    [sections],
  );

  // Lines for the virtualizer: either from sections' flat items or from splitting data
  const lines = React.useMemo(() => {
    if (flatItems) {
      return flatItems.map((item) => (item.type === 'header' ? item.containerName : item.text));
    }
    return data.split('\n');
  }, [data, flatItems]);

  // Suppress harmless ResizeObserver errors from virtualizer
  useResizeObserverFix();

  // keep search smooth input
  const deferredSearchText = React.useDeferredValue(searchText);
  const searchRegex = useSearchRegex(deferredSearchText);

  // Use tokenization hook for lazy tokenization with caching
  const { tokenizeLine } = useTokenization(lines);

  // Use line renderer hook for rendering individual lines
  const renderLine = useLineRenderer({
    tokenizeLine,
    searchRegex,
    currentSearchMatch,
  });

  const measureCallbackRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const measured = node.offsetHeight;
      if (measured > 0) {
        setItemSize(measured);
      }
    }
  }, []);

  // Measure average character width once on mount
  // Uses Canvas API to get accurate font metrics for height estimation
  React.useEffect(() => {
    if (!parentRef.current) return;

    const container = parentRef.current;

    // Use RAF to ensure DOM elements are fully rendered
    const rafId = requestAnimationFrame(() => {
      const style = getComputedStyle(container);
      const font = style.font || `${style.fontSize} ${style.fontFamily}`;

      // Measure average character width
      avgCharWidthRef.current = measureAverageCharWidth(font);

      // Calculate how many characters fit per line
      charsPerLineRef.current = calculateCharsPerLine(container, avgCharWidthRef.current);
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  // Conservative height estimation function
  // Uses text length to estimate wrapped lines, with safety margin
  // This is called by virtualizer for each row to estimate its height before rendering
  const estimateRowHeight = React.useCallback(
    (index: number): number => {
      if (itemSize === 0) return VIRTUALIZATION_CONFIG.FALLBACK_LINE_HEIGHT;

      const text = lines[index] || '';

      // Use dynamically calculated charsPerLine based on actual font metrics
      const charsPerLine = charsPerLineRef.current;
      const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLine));

      // Apply dynamic safety margin based on log size
      const safetyMultiplier = getSafetyMargin(lines.length);

      return Math.ceil(itemSize * estimatedLines * safetyMultiplier);
    },
    [itemSize, lines],
  );

  // Calculate overscan based on log size
  // Larger overscan = more items pre-rendered = more accurate measurements
  const overscanCount = React.useMemo(() => getOverscanCount(lines.length), [lines.length]);

  // Initialize virtualizer
  const virtualizer = useVirtualizer<HTMLDivElement, Element>({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateRowHeight,
    overscan: overscanCount,
  });

  // Handle scroll behavior (direction, programmatic scroll, scrollToRow)
  useVirtualizedScroll({
    virtualizer,
    scrollToRow,
    onScroll,
  });

  // Use line number navigation hook
  const { highlightedLines, handleLineClick, isLineHighlighted } = useLineNumberNavigation();

  // Enable keyboard navigation (PageUp, PageDown, Home, End)
  useKeyboardNavigation({
    virtualizer,
    scrollElementRef: parentRef,
    enabled: true,
  });

  // Scroll to highlighted lines when hash changes or on initial load
  React.useEffect(() => {
    if (highlightedLines && highlightedLines.start > 0 && lines.length > 0) {
      // Scroll to the start of the highlighted range
      // Convert 1-based line number to 0-based index
      const targetIndex = highlightedLines.start - 1;

      // If target line is out of range, scroll to the last line instead
      // This provides better UX by showing the user where the log ends
      const scrollIndex = targetIndex < lines.length ? targetIndex : lines.length - 1;

      // Track if component is still mounted to prevent RAF calls after unmount
      let isMounted = true;
      let rafId2: number | undefined;

      // Check if window is available (handles SSR and edge cases)
      if (typeof window === 'undefined' || !window.requestAnimationFrame) {
        return;
      }

      // Wait for next frame to ensure virtualizer is ready after state updates
      const rafId1 = requestAnimationFrame(() => {
        if (!isMounted) return;
        rafId2 = requestAnimationFrame(() => {
          if (!isMounted) return;
          virtualizer.scrollToIndex(scrollIndex, {
            align: 'center',
            behavior: 'auto',
          });
        });
      });

      // Cleanup: cancel pending animation frames on unmount or dependency change
      return () => {
        isMounted = false;
        cancelAnimationFrame(rafId1);
        if (rafId2 !== undefined) cancelAnimationFrame(rafId2);
      };
    }
    // Depend on both highlightedLines and lines.length to handle initial data load
    // virtualizer reference is stable from useVirtualizer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedLines, lines.length]);

  const virtualItems = virtualizer.getVirtualItems();

  // Cache total size to prevent layout shifts during scroll
  const totalSize = virtualizer.getTotalSize();

  return (
    <>
      {/* Hidden element to measure actual line height */}
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
        className="log-content__list log-content__with-gutter"
        tabIndex={0}
        style={{
          height: `${height}px`,
          width: typeof width === 'number' ? `${width}px` : width,
          overflow: 'auto',
        }}
        onClick={() => {
          // Ensure the container gets focus when clicked
          // This is necessary because child elements with absolute positioning
          // prevent clicks from reaching the parent
          parentRef.current?.focus();
        }}
      >
        {/* Total height container */}
        <div
          style={{
            height: `${totalSize}px`,
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
          <div className="log-content__content-column">
            {virtualItems.map((virtualItem) => {
              const lineNumber: number = virtualItem.index + 1;
              const isHighlighted = isLineHighlighted(lineNumber);
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className={`pf-v5-c-log-viewer__list-item ${isHighlighted ? 'log-content__line--highlighted' : ''}`}
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
