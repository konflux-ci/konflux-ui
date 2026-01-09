import React from 'react';
import { LogViewerToolbarContext } from '@patternfly/react-log-viewer';
import { Language, themes } from 'prism-react-renderer';
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
  theme?: 'light' | 'dark';
  className?: string;
  hasLineNumbers?: boolean; // Show line numbers with hash navigation
  language?: Language; // Language for syntax highlighting
}

/**
 * Virtualized log viewer using react-window
 *
 * Features:
 * - Uses react-window for virtualization
 * - Syntax highlighting with prism-react-renderer
 *   - Built-in support for code languages (js, yaml, json, etc.)
 *   - Custom 'log' language for log files (timestamps, levels, key-value pairs)
 * - Line numbers with hash navigation (#L10, #L10-L20)
 * - Search functionality with PatternFly LogViewerSearch
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
  hasLineNumbers = true,
  language,
}) => {
  // Get search context from parent
  const toolbarContext = React.useContext(LogViewerToolbarContext);
  const searchedInput = toolbarContext?.searchedInput || '';
  const currentMatchIndex = toolbarContext?.currentSearchedItemCount || 0;
  const searchedWordIndexes = toolbarContext?.searchedWordIndexes || [];
  const rowInFocus = searchedWordIndexes[currentMatchIndex];

  // Line selection for hash navigation
  const { selectedLines, handleLineClick, shouldScrollToSelection } = useLineSelection();
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [itemSize, setItemSize] = React.useState(20);

  const lineCount = React.useMemo(() => data.split('\n').length, [data]);

  // Select Prism theme based on theme prop
  const prismTheme = React.useMemo(() => {
    if (!language) return undefined;
    return theme === 'dark' ? themes.vsDark : themes.vsLight;
  }, [theme, language]);

  // Determine effective scroll row based on hash selection, search, or prop
  const effectiveScrollToRow = React.useMemo(() => {
    // Priority 1: Hash navigation (only if should scroll)
    if (selectedLines && shouldScrollToSelection) {
      return selectedLines.start;
    }
    // Priority 2: Search match
    if (rowInFocus && rowInFocus.rowIndex >= 0) {
      return rowInFocus.rowIndex + 1; // +1 because scrollToRow is 1-indexed
    }
    // Priority 3: Parent prop
    return scrollToRow;
  }, [selectedLines, shouldScrollToSelection, rowInFocus, scrollToRow]);

  const handleScrollWithOffset = (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => {
    setScrollOffset(props.scrollOffset);
    onScroll?.(props);
  };

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
        <div
          className="pf-v5-c-log-viewer__scroll-container"
          style={{ height: '100%', display: 'flex' }}
        >
          {hasLineNumbers && (
            <LineNumberGutter
              lineCount={lineCount}
              height={height}
              lineHeight={itemSize}
              selectedLines={selectedLines}
              onLineClick={handleLineClick}
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
            onItemSizeMeasured={setItemSize}
            language={language}
            prismTheme={prismTheme}
          />
        </div>
      </div>
    </div>
  );
};
