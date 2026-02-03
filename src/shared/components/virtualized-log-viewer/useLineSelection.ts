import { useState, useEffect, useCallback, useRef } from 'react';

interface LineSelection {
  start: number;
  end: number;
}

export const useLineSelection = () => {
  const [selectedLines, setSelectedLines] = useState<LineSelection | null>(null);
  const [lastClickedLine, setLastClickedLine] = useState<number | null>(null);
  const [shouldScrollToSelection, setShouldScrollToSelection] = useState(false);
  const isUserClickRef = useRef(false);

  // Callback to reset scroll flag after scrolling completes
  const resetScrollFlag = useCallback(() => {
    setShouldScrollToSelection(false);
  }, []);

  // Parse hash from URL on mount and on hash change
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      if (!hash) {
        setSelectedLines(null);
        setShouldScrollToSelection(false);
        return;
      }

      // Support #L10 or #L10-L20 format
      const singleLineMatch = hash.match(/^#L(\d+)$/);
      const rangeMatch = hash.match(/^#L(\d+)-L(\d+)$/);

      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        setSelectedLines({ start: Math.min(start, end), end: Math.max(start, end) });
        // Only set lastClickedLine for user clicks, not for URL hash changes
        // This prevents conflicts when user manually edits URL
        if (!isUserClickRef.current) {
          setLastClickedLine(null);
        }
        // Only scroll if not triggered by user click
        setShouldScrollToSelection(!isUserClickRef.current);
      } else if (singleLineMatch) {
        const line = parseInt(singleLineMatch[1], 10);
        setSelectedLines({ start: line, end: line });
        // Only set lastClickedLine for user clicks to support Shift+Click range selection
        if (isUserClickRef.current) {
          setLastClickedLine(line);
        } else {
          setLastClickedLine(null);
        }
        // Only scroll if not triggered by user click
        setShouldScrollToSelection(!isUserClickRef.current);
      } else {
        setSelectedLines(null);
        setLastClickedLine(null);
        setShouldScrollToSelection(false);
      }

      // Reset the flag after processing
      isUserClickRef.current = false;
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const handleLineClick = useCallback(
    (lineNumber: number, isRange: boolean) => {
      // Mark that this hash change is from user click
      isUserClickRef.current = true;

      if (isRange && lastClickedLine !== null) {
        // Range selection with Shift key
        const start = Math.min(lastClickedLine, lineNumber);
        const end = Math.max(lastClickedLine, lineNumber);
        setSelectedLines({ start, end });
        window.location.hash = `#L${start}-L${end}`;
      } else {
        // Single line selection
        setSelectedLines({ start: lineNumber, end: lineNumber });
        setLastClickedLine(lineNumber);
        window.location.hash = `#L${lineNumber}`;
      }
    },
    [lastClickedLine],
  );

  return { selectedLines, handleLineClick, shouldScrollToSelection, resetScrollFlag };
};
