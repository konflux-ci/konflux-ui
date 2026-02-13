import React from 'react';
import { SearchedWord } from '~/shared/components/virtualized-log-viewer/VirtualizedLogContent';

interface UseLogViewerSearchParams {
  lines: string[];
  autoScroll: boolean;
}

interface UseLogViewerSearchResult {
  // Context values
  logViewerContextValue: {
    parsedData: string[];
    searchedInput: string;
  };
  toolbarContextValue: {
    searchedWordIndexes: SearchedWord[];
    scrollToRow: (row: SearchedWord) => void;
    setSearchedInput: React.Dispatch<React.SetStateAction<string>>;
    setCurrentSearchedItemCount: React.Dispatch<React.SetStateAction<number>>;
    setRowInFocus: React.Dispatch<React.SetStateAction<SearchedWord>>;
    setSearchedWordIndexes: React.Dispatch<React.SetStateAction<SearchedWord[]>>;
    currentSearchedItemCount: number;
    searchedInput: string;
    itemCount: number;
    rowInFocus: SearchedWord;
  };
  // Computed scroll row
  scrolledRow: number;
}

/**
 * Custom hook to manage LogViewer search state and context values
 *
 * Provides:
 * - Search state management (searchedInput, searchedWordIndexes, rowInFocus)
 * - Context values for LogViewerSearch component
 * - Computed scroll row based on search focus or auto-scroll
 */
export const useLogViewerSearch = ({
  lines,
  autoScroll,
}: UseLogViewerSearchParams): UseLogViewerSearchResult => {
  // Search state
  const [searchedWordIndexes, setSearchedWordIndexes] = React.useState<SearchedWord[]>([]);
  const [searchedInput, setSearchedInput] = React.useState('');
  const [currentSearchedItemCount, setCurrentSearchedItemCount] = React.useState(0);
  const [rowInFocus, setRowInFocus] = React.useState<SearchedWord>({
    rowIndex: -1,
    matchIndex: -1,
  });

  // Scroll to row handler
  const handleScrollToRow = React.useCallback((row: SearchedWord) => {
    setRowInFocus(row);
  }, []);

  // Context value for LogViewerContext
  const logViewerContextValue = React.useMemo(
    () => ({
      parsedData: lines,
      searchedInput,
    }),
    [lines, searchedInput],
  );

  // Context value for LogViewerToolbarContext
  const toolbarContextValue = React.useMemo(
    () => ({
      searchedWordIndexes,
      scrollToRow: handleScrollToRow,
      setSearchedInput,
      setCurrentSearchedItemCount,
      setRowInFocus,
      setSearchedWordIndexes,
      currentSearchedItemCount,
      searchedInput,
      itemCount: lines.length,
      rowInFocus,
    }),
    [
      searchedWordIndexes,
      handleScrollToRow,
      currentSearchedItemCount,
      searchedInput,
      lines.length,
      rowInFocus,
    ],
  );

  // Compute scroll row based on search focus or auto-scroll
  const scrolledRow = React.useMemo(() => {
    // If searching and have a current match, scroll to it
    if (rowInFocus.rowIndex >= 0 && rowInFocus.rowIndex < lines.length) {
      return rowInFocus.rowIndex + 1; // +1 because scrollToRow is 1-indexed
    }
    // Otherwise, if auto-scroll is enabled, scroll to end
    if (autoScroll) {
      return lines.length;
    }
    return 0;
  }, [autoScroll, lines.length, rowInFocus]);

  return {
    logViewerContextValue,
    toolbarContextValue,
    scrolledRow,
  };
};
