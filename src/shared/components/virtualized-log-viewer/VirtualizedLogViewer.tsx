import React from 'react';
import { LogViewerToolbarContext } from '@patternfly/react-log-viewer';
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
  theme?: 'light' | 'dark';
  className?: string;
}

/**
 * Virtualized log viewer using react-window
 *
 * Features:
 * - Uses react-window for virtualization
 * - Renders plain text (no syntax highlighting yet)
 * - Drop-in replacement for PatternFly LogViewer
 */
export const VirtualizedLogViewer: React.FC<VirtualizedLogViewerProps> = ({
  data,
  height,
  width = '100%',
  scrollToRow,
  onScroll,
  theme = 'dark',
  className = '',
}) => {
  // Get search context from parent
  const toolbarContext = React.useContext(LogViewerToolbarContext);
  const searchedInput = toolbarContext?.searchedInput || '';
  const currentMatchIndex = toolbarContext?.currentSearchedItemCount || 0;
  const searchedWordIndexes = toolbarContext?.searchedWordIndexes || [];
  const rowInFocus = searchedWordIndexes[currentMatchIndex];

  // Determine effective scroll row based on search or prop
  const effectiveScrollToRow = React.useMemo(() => {
    if (rowInFocus && rowInFocus.rowIndex >= 0) {
      return rowInFocus.rowIndex + 1; // +1 because scrollToRow is 1-indexed
    }
    return scrollToRow;
  }, [rowInFocus, scrollToRow]);

  return (
    /* Note: Using raw div elements with PatternFly CSS classes instead of layout components.
     * This structure is required by PatternFly's LogViewer CSS system:
     * - .pf-v5-c-log-viewer: Root container with theme modifier
     * - .pf-v5-c-log-viewer__main: Applies border, background color, dark theme styles
     * - .pf-v5-c-log-viewer__scroll-container: Applies padding and height
     * Using PatternFly layout components (Flex, Stack, etc.) would break this CSS cascade.
     * Reference: @patternfly/react-styles/css/components/LogViewer/log-viewer.css
     */
    <div
      className={`pf-v5-c-log-viewer ${theme === 'dark' ? 'pf-m-dark' : ''} ${className}`}
      style={{ height, width }}
    >
      <div className="pf-v5-c-log-viewer__main" style={{ height: '100%' }}>
        <div className="pf-v5-c-log-viewer__scroll-container" style={{ height: '100%' }}>
          <VirtualizedLogContent
            data={data}
            height={height}
            width={width}
            scrollToRow={effectiveScrollToRow}
            onScroll={onScroll}
            searchText={searchedInput}
            currentSearchMatch={rowInFocus}
          />
        </div>
      </div>
    </div>
  );
};
