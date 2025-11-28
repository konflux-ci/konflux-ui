import React from 'react';

interface UseLogLineNavigationOptions {
  onDisableAutoScroll?: () => void;
}

interface SelectedRange {
  start: number;
  end: number;
}

interface UseLogLineNavigationResult {
  logViewerRef: React.RefObject<HTMLDivElement>;
  targetScrollRow: number | null;
  onScrollComplete: () => void;
}

/**
 * Custom hook for log line navigation via URL hash (GitHub-style)
 * Features:
 * - Clickable line numbers that update URL hash
 * - Single range selection: #L10 or #L10-L20
 * - Line highlighting (Click = single line, Shift = range)
 * - Browser back/forward support
 * - Persistent highlights across virtual scroll updates
 */
export function useLogLineNavigation(
  data: string,
  options?: UseLogLineNavigationOptions,
): UseLogLineNavigationResult {
  const { onDisableAutoScroll } = options || {};
  const logViewerRef = React.useRef<HTMLDivElement>(null);

  const [lastClickedLine, setLastClickedLine] = React.useState<number | null>(null);
  const [selectedRange, setSelectedRange] = React.useState<SelectedRange | null>(null);
  const [targetScrollRow, setTargetScrollRow] = React.useState<number | null>(null);

  // Track if hash change was triggered by user click (to avoid duplicate processing)
  const hashChangeFromClickRef = React.useRef(false);

  /** Parse hash into single range: #L10 or #L10-L20 */
  const parseHash = React.useCallback((hash: string): SelectedRange | null => {
    if (!hash) return null;

    const match = hash.match(/#L(\d+)(?:-L(\d+))?/);
    if (!match) return null;

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;

    return { start, end };
  }, []);

  /** Convert range to hash: {start: 10, end: 20} -> #L10-L20 */
  const rangeToHash = React.useCallback((range: SelectedRange): string => {
    if (range.start === range.end) {
      return `#L${range.start}`;
    }
    return `#L${range.start}-L${range.end}`;
  }, []);

  /** Highlight a single range of lines */
  const applyHighlights = React.useCallback((range: SelectedRange | null) => {
    const container = logViewerRef.current;
    if (!container) return;

    // Clear all previous highlights
    container
      .querySelectorAll('.log-line-selected')
      .forEach((el) => el.classList.remove('log-line-selected'));

    if (!range) {
      setSelectedRange(null);
      return;
    }

    // Apply highlights for the range
    const lines = container.querySelectorAll('.pf-v5-c-log-viewer__list-item');
    lines.forEach((line) => {
      const indexEl = line.querySelector('.pf-v5-c-log-viewer__index');
      const lineNum = indexEl ? parseInt(indexEl.textContent || '', 10) : NaN;

      if (!isNaN(lineNum) && lineNum >= range.start && lineNum <= range.end) {
        line.classList.add('log-line-selected');
      }
    });

    setSelectedRange(range);
  }, []);

  /** Called when scroll completes - applies highlights and clears targetScrollRow */
  const onScrollComplete = React.useCallback(() => {
    if (targetScrollRow !== null && selectedRange) {
      requestAnimationFrame(() => {
        applyHighlights(selectedRange);
        // Clear targetScrollRow to restore free scrolling
        setTargetScrollRow(null);
      });
    }
  }, [targetScrollRow, selectedRange, applyHighlights]);

  /** Navigate to hash: #L10 or #L10-L20 */
  const navigateToHash = React.useCallback(
    (hash: string, shouldScroll = false) => {
      const range = parseHash(hash);
      if (!range) return;

      onDisableAutoScroll?.();
      setLastClickedLine(range.start);
      setSelectedRange(range);

      if (shouldScroll) {
        // Use PatternFly's scrollToRow for virtual scrolling support
        // Highlights will be applied in onScrollComplete callback
        setTargetScrollRow(range.start);
      } else {
        // No scroll needed (user clicked line number) - apply highlights immediately
        requestAnimationFrame(() => {
          applyHighlights(range);
        });
      }
    },
    [onDisableAutoScroll, parseHash, applyHighlights],
  );

  /** Handle line number clicks (GitHub-style): Click = single line, Shift = range */
  React.useEffect(() => {
    const container = logViewerRef.current;
    if (!container) return;

    const handleLineClick = (e: MouseEvent) => {
      const lineNumberEl = (e.target as Element).closest('.pf-v5-c-log-viewer__index');
      if (!lineNumberEl) return;

      const lineNum = parseInt(lineNumberEl.textContent || '', 10);
      if (isNaN(lineNum)) return;

      let newRange: SelectedRange;

      if (e.shiftKey && lastClickedLine !== null) {
        // Shift: Create range from last clicked line to current line
        const start = Math.min(lastClickedLine, lineNum);
        const end = Math.max(lastClickedLine, lineNum);
        newRange = { start, end };
      } else {
        // Normal click: Select only this line
        newRange = { start: lineNum, end: lineNum };
        setLastClickedLine(lineNum);
      }

      // Mark that this hash change is from a click (to prevent scrolling)
      hashChangeFromClickRef.current = true;

      // Update URL hash
      const newHash = rangeToHash(newRange);
      window.location.hash = newHash;

      // Apply highlights directly without scrolling
      // (user is already at the clicked position)
      applyHighlights(newRange);

      // Reset flag after hash change event
      setTimeout(() => {
        hashChangeFromClickRef.current = false;
      }, 50);
    };

    container.addEventListener('click', handleLineClick);
    return () => container.removeEventListener('click', handleLineClick);
  }, [lastClickedLine, applyHighlights, rangeToHash]);

  /** Re-apply highlights when virtual scroll updates the DOM */
  React.useEffect(() => {
    const container = logViewerRef.current;
    if (!container || !selectedRange) return;

    let isApplying = false;
    const observer = new MutationObserver(() => {
      if (selectedRange && !isApplying) {
        isApplying = true;
        requestAnimationFrame(() => {
          applyHighlights(selectedRange);
          isApplying = false;
        });
      }
    });

    const listEl = container.querySelector('.pf-v5-c-log-viewer__list');
    if (listEl) {
      observer.observe(listEl, { childList: true, subtree: false });
    }

    return () => observer.disconnect();
  }, [selectedRange, applyHighlights]);

  /** Initial hash navigation */
  React.useEffect(() => {
    if (data && window.location.hash) {
      navigateToHash(window.location.hash);
    }
  }, [data, navigateToHash]);

  /** Handle browser back/forward hash changes */
  React.useEffect(() => {
    const handleHashChange = () => {
      // Skip if this hash change was triggered by user clicking line numbers
      if (hashChangeFromClickRef.current) {
        return;
      }

      const hash = window.location.hash;
      if (hash) {
        // Hash changed externally (URL edit, back/forward) - scroll to position
        navigateToHash(hash, true);
      } else {
        // Clear all highlights when hash is removed
        applyHighlights(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigateToHash, applyHighlights]);

  return { logViewerRef, targetScrollRow, onScrollComplete };
}
