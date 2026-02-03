import React from 'react';
import { LogViewerToolbarContext } from '@patternfly/react-log-viewer';
import { Virtualizer } from '@tanstack/react-virtual';
import { LineNumberGutter } from './LineNumberGutter';
import { useLineSelection } from './useLineSelection';
import { VirtualizedLogContent } from './VirtualizedLogContent';
import '@patternfly/react-styles/css/components/LogViewer/log-viewer.css';

import './VirtualizedLogViewer.scss';

export interface VirtualizedLogViewerProps {
  data: string;
  height: number; // Required: height in pixels for virtualization
  width?: string | number;
  scrollToRow?: number;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
  hasLineNumbers?: boolean; // Show line numbers with hash navigation support
}

/**
 * Virtualized log viewer using @tanstack/react-virtual
 *
 * Features:
 * - Uses @tanstack/react-virtual for virtualization
 * - Renders plain text (no syntax highlighting yet)
 * - Drop-in replacement for PatternFly LogViewer
 */
export const VirtualizedLogViewer: React.FC<VirtualizedLogViewerProps> = ({
  data,
  height,
  width = '100%',
  scrollToRow,
  onScroll,
  hasLineNumbers = true,
}) => {
  // Get search context from parent
  const toolbarContext = React.useContext(LogViewerToolbarContext);
  const searchedInput = toolbarContext?.searchedInput || '';
  const currentMatchIndex = toolbarContext?.currentSearchedItemCount || 0;
  const searchedWordIndexes = toolbarContext?.searchedWordIndexes || [];

  // Prioritize toolbarContext.rowInFocus if it has a valid rowIndex (>= 0)
  // This allows programmatic navigation via scrollToRow() to work correctly
  const rowInFocus =
    toolbarContext?.rowInFocus && toolbarContext.rowInFocus.rowIndex >= 0
      ? toolbarContext.rowInFocus
      : searchedWordIndexes[currentMatchIndex];

  // Line selection for hash navigation
  const { selectedLines, handleLineClick, shouldScrollToSelection, resetScrollFlag } =
    useLineSelection();

  // State for virtualizer instance and current scroll offset
  const [contentVirtualizer, setContentVirtualizer] = React.useState<Virtualizer<
    HTMLDivElement,
    Element
  > | null>(null);

  // Track scroll offset to pass as prop to LineNumberGutter
  // This ensures LineNumberGutter re-renders when scrolling occurs
  const [scrollOffset, setScrollOffset] = React.useState(0);

  // Handle scroll events and update scroll offset state
  const handleScrollWithOffset = React.useCallback(
    (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => {
      setScrollOffset(props.scrollOffset);
      onScroll?.(props);
    },
    [onScroll],
  );

  // Determine effective scroll row based on hash selection, search, or prop
  const effectiveScrollToRow = React.useMemo(() => {
    // Priority 1: Hash navigation (only if should scroll AND data is loaded)
    // Wait for data to load before scrolling to hash position
    if (selectedLines && shouldScrollToSelection && data.length > 0) {
      return selectedLines.start;
    }
    // Priority 2: Search match
    if (rowInFocus && rowInFocus.rowIndex >= 0) {
      return rowInFocus.rowIndex + 1; // +1 because scrollToRow is 1-indexed
    }
    // Priority 3: Parent prop
    return scrollToRow;
  }, [selectedLines, shouldScrollToSelection, data.length, rowInFocus, scrollToRow]);

  // Reset scroll flag after scrolling is initiated
  React.useEffect(() => {
    if (shouldScrollToSelection && effectiveScrollToRow !== undefined) {
      // Use requestAnimationFrame for instant response after browser paint
      const rafId = requestAnimationFrame(() => {
        resetScrollFlag();
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [shouldScrollToSelection, effectiveScrollToRow, resetScrollFlag]);

  return (
    /* Note: Using raw div elements with PatternFly CSS classes instead of layout components.
     * This structure is required by PatternFly's LogViewer CSS system:
     * - .pf-v5-c-log-viewer__main: Applies border, background color, dark theme styles
     * - .pf-v5-c-log-viewer__scroll-container: Applies padding and height
     * Using PatternFly layout components (Flex, Stack, etc.) would break this CSS cascade.
     * Reference: @patternfly/react-styles/css/components/LogViewer/log-viewer.css
     */
    <div className="pf-v5-c-log-viewer__main" style={{ height: '100%' }}>
      <div
        className="pf-v5-c-log-viewer__scroll-container"
        style={{ height: '100%', display: hasLineNumbers ? 'flex' : 'block' }}
      >
        {hasLineNumbers && contentVirtualizer && (
          <LineNumberGutter
            height={height}
            selectedLines={selectedLines}
            onLineClick={handleLineClick}
            parentVirtualizer={contentVirtualizer}
            scrollOffset={scrollOffset}
          />
        )}
        <VirtualizedLogContent
          data={data}
          height={height}
          width={width}
          scrollToRow={effectiveScrollToRow}
          onScroll={handleScrollWithOffset}
          searchText={searchedInput}
          currentSearchMatch={rowInFocus}
          selectedLines={selectedLines}
          onVirtualizerReady={setContentVirtualizer}
        />
      </div>
    </div>
  );
};
