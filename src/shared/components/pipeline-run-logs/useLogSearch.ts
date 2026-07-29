import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { SearchedWord } from '../virtualized-log-viewer/types';

type Props = {
  lines: string[];
};

type UseLogSearchResult = {
  searchText: string;
  setSearchText: (value: string) => void;
  currentMatch: SearchedWord | undefined;
  currentMatchIndex: number;
  matchCount: number;
  nextMatch: () => void;
  prevMatch: () => void;
  scrollToRow: number;
};

export const useLogSearch = ({ lines }: Props): UseLogSearchResult => {
  const [searchText, setSearchText] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  const deferredSearchText = useDeferredValue(searchText);

  const matches = useMemo(() => {
    if (!deferredSearchText) return [];
    const result: SearchedWord[] = [];
    const searchLower = deferredSearchText.toLowerCase();
    lines.forEach((line, rowIndex) => {
      const lineLower = line.toLowerCase();
      let matchIndex = 1;
      // find all occurrences within the line
      let pos = lineLower.indexOf(searchLower);
      while (pos !== -1) {
        result.push({ rowIndex, matchIndex });
        matchIndex++;
        pos = lineLower.indexOf(searchLower, pos + searchLower.length);
      }
    });
    return result;
  }, [lines, deferredSearchText]);

  const matchCount = matches.length;

  // reset current match when search text changes, not when lines update
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [deferredSearchText]);

  const safeMatchIndex = matchCount > 0 ? Math.min(currentMatchIndex, matchCount - 1) : 0;
  const currentMatch = matches[safeMatchIndex];

  const nextMatch = useCallback(() => {
    setCurrentMatchIndex((prev) => (matchCount > 0 ? (prev + 1) % matchCount : 0));
  }, [matchCount]);

  const prevMatch = useCallback(() => {
    setCurrentMatchIndex((prev) => (matchCount > 0 ? (prev - 1 + matchCount) % matchCount : 0));
  }, [matchCount]);

  // scrollToRow is 1-indexed (VirtualizedLogContent convention)
  const scrollToRow = currentMatch ? currentMatch.rowIndex + 1 : 0;

  return {
    searchText,
    setSearchText,
    currentMatch,
    currentMatchIndex,
    matchCount,
    nextMatch,
    prevMatch,
    scrollToRow,
  };
};
