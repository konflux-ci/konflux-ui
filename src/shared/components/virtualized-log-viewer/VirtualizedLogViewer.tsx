import React from 'react';
import { LogViewerToolbarContext } from '@patternfly/react-log-viewer';
import type { LogSection, NormalizedLogSection } from './types';
import { VirtualizedLogContent } from './VirtualizedLogContent';
import '@patternfly/react-styles/css/components/LogViewer/log-viewer.css';

import './VirtualizedLogViewer.scss';

export interface VirtualizedLogViewerProps {
  sections: LogSection[];
  /** Pre-normalized sections forwarded to VirtualizedLogContent to avoid redundant normalization */
  normalizedSections?: NormalizedLogSection[];
  height: number;
  width?: string | number;
  scrollToRow?: number;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
  /**
   * When false, URL hash line navigation (`#L123`) is deferred until logs are fully fetched.
   * Defaults to true.
   */
  readyToNavigate?: boolean;
}

export const VirtualizedLogViewer: React.FC<VirtualizedLogViewerProps> = ({
  sections,
  normalizedSections,
  height,
  width = '100%',
  scrollToRow,
  onScroll,
  readyToNavigate = true,
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

  // Expand folded steps only when using search prev/next — not when typing a query.
  const [expandSearchTargetRow, setExpandSearchTargetRow] = React.useState<number | undefined>();
  const prevSearchedInputRef = React.useRef(searchedInput);
  const prevMatchIndexRef = React.useRef(currentMatchIndex);

  React.useEffect(() => {
    const isNewSearch = prevSearchedInputRef.current !== searchedInput;
    prevSearchedInputRef.current = searchedInput;

    if (isNewSearch) {
      if (rowInFocus && rowInFocus.rowIndex >= 0) {
        setExpandSearchTargetRow(rowInFocus.rowIndex + 1);
      } else {
        setExpandSearchTargetRow(undefined);
      }
      prevMatchIndexRef.current = currentMatchIndex;
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
        normalizedSections={normalizedSections}
        height={height}
        width={width}
        scrollToRow={scrollToRow}
        expandSearchTargetRow={expandSearchTargetRow}
        onScroll={onScroll}
        searchText={searchedInput}
        currentSearchMatch={rowInFocus}
        readyToNavigate={readyToNavigate}
      />
    </div>
  );
};
