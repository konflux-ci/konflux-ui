import React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
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

  // Determine effective scroll row based on search or prop
  const effectiveScrollToRow = React.useMemo(() => {
    if (rowInFocus && rowInFocus.rowIndex >= 0) {
      return rowInFocus.rowIndex + 1; // +1 because scrollToRow is 1-indexed
    }
    return scrollToRow;
  }, [rowInFocus, scrollToRow]);

  return (
    <Stack className="pf-v5-c-log-viewer__main" style={{ height: '100%' }}>
      <StackItem className="pf-v5-c-log-viewer__scroll-container" style={{ height: '100%' }}>
        <VirtualizedLogContent
          data={data}
          height={height}
          width={width}
          scrollToRow={effectiveScrollToRow}
          onScroll={onScroll}
          searchText={searchedInput}
          currentSearchMatch={rowInFocus}
        />
      </StackItem>
    </Stack>
  );
};
