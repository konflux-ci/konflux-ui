import React from 'react';

export interface HighlightedLineRange {
  start: number;
  end: number;
}

export interface UseLineNumberNavigationResult {
  highlightedLines: HighlightedLineRange | null;
  firstSelectedLine: number | null;
  handleLineClick: (lineNumber: number, event: React.MouseEvent) => void;
  isLineHighlighted: (lineNumber: number) => boolean;
}

/**
 * Custom hook to manage line number navigation and highlighting
 *
 * Supports:
 * - Single line selection (#L123)
 * - Range selection with shift-click (#L10-L20)
 * - URL hash parsing and updates
 * - Highlight state management
 */
export const useLineNumberNavigation = (): UseLineNumberNavigationResult => {
  // Track the first selected line for range selection
  const [firstSelectedLine, setFirstSelectedLine] = React.useState<number | null>(null);

  // Parse hash to get highlighted line(s)
  // No need for useCallback - function has no dependencies and is only called from effects
  const getHighlightedLines = (): HighlightedLineRange | null => {
    const hash = window.location.hash;
    const LINE_NUMBER_RANGE_REGEX = /^#L(\d+)-L(\d+)$/; // Match #L123-L456 (range)
    const LINE_NUMBER_SINGLE_REGEX = /^#L(\d+)$/; // Match #L123 (single line)

    const rangeMatch = hash.match(LINE_NUMBER_RANGE_REGEX);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      return { start: Math.min(start, end), end: Math.max(start, end) };
    }

    const singleMatch = hash.match(LINE_NUMBER_SINGLE_REGEX);
    if (singleMatch) {
      const line = parseInt(singleMatch[1], 10);
      return { start: line, end: line };
    }

    return null;
  };

  // Use lazy initialization to avoid calling getHighlightedLines on every render
  const [highlightedLines, setHighlightedLines] = React.useState(() => getHighlightedLines());

  // Track the last hash to detect changes (including when hash is cleared)
  const lastHashRef = React.useRef(window.location.hash);

  // Effect to detect hash changes on every render (including changes without hashchange event)
  // This runs frequently but the ref comparison prevents unnecessary state updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const currentHash = window.location.hash;

    // Check if this was an internal navigation using history.state
    const isInternalNavigation = window.history.state?.source === 'line-click';

    // Only update if hash actually changed (ref comparison prevents infinite loops)
    if (currentHash !== lastHashRef.current) {
      lastHashRef.current = currentHash;
      const newHighlight = getHighlightedLines();
      setHighlightedLines(newHighlight);

      // Reset firstSelectedLine if:
      // 1. Hash was cleared (switching views), OR
      // 2. This was NOT an internal navigation (external hash change or browser navigation)
      if (!currentHash || !newHighlight || !isInternalNavigation) {
        setFirstSelectedLine(null);
      }
    }
  }); // No dependency array - runs on every render to detect hash changes without hashchange event

  // Separate effect for hashchange event listener (browser back/forward)
  React.useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash;
      lastHashRef.current = newHash;
      const newHighlight = getHighlightedLines();
      setHighlightedLines(newHighlight);

      // Always reset firstSelectedLine on hashchange event (external navigation)
      setFirstSelectedLine(null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []); // Empty dependency array - listener only needs to be set up once

  // Handle line number click for hash navigation
  const handleLineClick = React.useCallback(
    (lineNumber: number, event: React.MouseEvent) => {
      if (event.shiftKey && firstSelectedLine !== null) {
        // Shift-click: create range
        const start = Math.min(firstSelectedLine, lineNumber);
        const end = Math.max(firstSelectedLine, lineNumber);
        const hash = `#L${start}-L${end}`;
        // Use history.state to mark this as an internal navigation
        window.history.pushState({ source: 'line-click' }, '', hash);
        setHighlightedLines({ start, end });
        setFirstSelectedLine(null); // Reset after creating range
      } else {
        // Normal click: select single line
        const hash = `#L${lineNumber}`;
        // Use history.state to mark this as an internal navigation
        window.history.pushState({ source: 'line-click' }, '', hash);
        setHighlightedLines({ start: lineNumber, end: lineNumber });
        setFirstSelectedLine(lineNumber);
      }
    },
    [firstSelectedLine],
  );

  // Check if a line is highlighted
  const isLineHighlighted = React.useCallback(
    (lineNumber: number): boolean => {
      if (!highlightedLines) return false;
      return lineNumber >= highlightedLines.start && lineNumber <= highlightedLines.end;
    },
    [highlightedLines],
  );

  return {
    highlightedLines,
    firstSelectedLine,
    handleLineClick,
    isLineHighlighted,
  };
};
