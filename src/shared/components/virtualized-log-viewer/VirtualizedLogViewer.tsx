import React from 'react';
import { LogViewerToolbarContext } from '@patternfly/react-log-viewer';
import type { LogSection } from './types';
import { VirtualizedLogContent } from './VirtualizedLogContent';
import '@patternfly/react-styles/css/components/LogViewer/log-viewer.css';

import './VirtualizedLogViewer.scss';

export interface VirtualizedLogViewerProps {
  data: string;
  /**
   * When provided, the viewer renders in sectioned mode: each LogSection becomes
   * a foldable step with a sticky header, continuous line numbers, ANSI colours,
   * keyboard navigation, and URL-hash line linking — all from the existing
   * VirtualizedLogContent infrastructure.
   */
  sections?: readonly LogSection[];
  height: number;
  width?: string | number;
  scrollToRow?: number;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
}

export const VirtualizedLogViewer: React.FC<VirtualizedLogViewerProps> = ({
  data,
  sections,
  height,
  width = '100%',
  scrollToRow,
  onScroll,
}) => {
  const toolbarContext = React.useContext(LogViewerToolbarContext);
  const searchedInput = toolbarContext?.searchedInput || '';
  const currentMatchIndex = toolbarContext?.currentSearchedItemCount || 0;
  const searchedWordIndexes = toolbarContext?.searchedWordIndexes || [];

  const rowInFocus =
    toolbarContext?.rowInFocus && toolbarContext.rowInFocus.rowIndex >= 0
      ? toolbarContext.rowInFocus
      : searchedWordIndexes[currentMatchIndex];

  const effectiveScrollToRow = React.useMemo(() => {
    if (rowInFocus && rowInFocus.rowIndex >= 0) {
      return rowInFocus.rowIndex + 1;
    }
    return scrollToRow;
  }, [rowInFocus, scrollToRow]);

  return (
    <div className="pf-v5-c-log-viewer__main">
      <VirtualizedLogContent
        data={data}
        sections={sections}
        height={height}
        width={width}
        scrollToRow={effectiveScrollToRow}
        onScroll={onScroll}
        searchText={searchedInput}
        currentSearchMatch={rowInFocus}
      />
    </div>
  );
};
