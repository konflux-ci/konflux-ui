import React from 'react';
import { LogViewerToolbarContext } from '@patternfly/react-log-viewer';
import type { LogSection } from './types';
import { VirtualizedLogContent } from './VirtualizedLogContent';
import '@patternfly/react-styles/css/components/LogViewer/log-viewer.css';

import './VirtualizedLogViewer.scss';

export interface VirtualizedLogViewerProps {
  sections: LogSection[];
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
  sections,
  height,
  width = '100%',
  scrollToRow,
  onScroll,
}) => {
  const toolbarContext = React.useContext(LogViewerToolbarContext);
  const searchedInput =
    typeof toolbarContext?.searchedInput === 'string' ? toolbarContext.searchedInput : '';
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

  // Expand folded steps only when using search prev/next — not when typing a query.
  const [expandSearchTargetRow, setExpandSearchTargetRow] = React.useState<number | undefined>();
  const prevSearchedInputRef = React.useRef(searchedInput);
  const prevMatchIndexRef = React.useRef(currentMatchIndex);

  React.useEffect(() => {
    const isNewSearch = prevSearchedInputRef.current !== searchedInput;
    prevSearchedInputRef.current = searchedInput;

    if (isNewSearch) {
      prevMatchIndexRef.current = currentMatchIndex;
      setExpandSearchTargetRow(undefined);
      return;
    }

    if (
      currentMatchIndex !== prevMatchIndexRef.current &&
      rowInFocus &&
      rowInFocus.rowIndex >= 0
    ) {
      setExpandSearchTargetRow(rowInFocus.rowIndex + 1);
    }
    prevMatchIndexRef.current = currentMatchIndex;
  }, [searchedInput, currentMatchIndex, rowInFocus]);

  return (
    <div className="pf-v5-c-log-viewer__main">
      <VirtualizedLogContent
        sections={sections}
        height={height}
        width={width}
        scrollToRow={effectiveScrollToRow}
        expandSearchTargetRow={expandSearchTargetRow}
        onScroll={onScroll}
        searchText={searchedInput}
        currentSearchMatch={rowInFocus}
      />
    </div>
  );
};
