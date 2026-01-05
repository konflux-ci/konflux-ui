import React from 'react';
import { Virtualizer } from '@tanstack/react-virtual';

interface UseVirtualizedScrollParams {
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  scrollToRow?: number;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
}

/**
 * Custom hook to manage scroll behavior for virtualized log viewer
 *
 * Handles:
 * - Scroll offset monitoring and onScroll callback
 * - Scroll direction detection (forward/backward)
 * - Programmatic scroll tracking (user vs program initiated)
 * - ScrollToRow functionality with proper cleanup
 */
export const useVirtualizedScroll = ({
  virtualizer,
  scrollToRow,
  onScroll,
}: UseVirtualizedScrollParams) => {
  const prevScrollOffset = React.useRef<number>(0);
  const scrollToIndexRef = React.useRef<number | undefined>(undefined);

  // Track scroll offset changes and trigger onScroll callback
  const scrollOffset = virtualizer.scrollOffset ?? 0;

  React.useEffect(() => {
    if (!onScroll) return;

    // Determine scroll direction
    const scrollDirection: 'forward' | 'backward' =
      scrollOffset >= prevScrollOffset.current ? 'forward' : 'backward';

    // Match PatternFly LogViewer semantics:
    // scrollUpdateWasRequested is true when user manually scrolls (NOT programmatic)
    // This is opposite to what the name suggests, but matches PatternFly behavior
    const scrollUpdateWasRequested = scrollToIndexRef.current === undefined;

    prevScrollOffset.current = scrollOffset;

    onScroll({
      scrollDirection,
      scrollOffset,
      scrollUpdateWasRequested,
    });
  }, [scrollOffset, onScroll]);

  // Scroll to specific row when scrollToRow changes
  React.useEffect(() => {
    if (scrollToRow !== undefined && scrollToRow > 0) {
      const targetIndex = scrollToRow - 1;
      scrollToIndexRef.current = targetIndex;
      virtualizer.scrollToIndex(targetIndex, { align: 'center' });
      // Typical duration for smooth scroll animation to settle
      const SCROLL_ANIMATION_DURATION_MS = 300;
      // Clear the flag after scroll animation completes (300ms is typical for smooth scroll)
      const timer = setTimeout(() => {
        scrollToIndexRef.current = undefined;
      }, SCROLL_ANIMATION_DURATION_MS);

      return () => clearTimeout(timer);
    }

    // Clear the flag immediately when scrollToRow becomes undefined/0
    scrollToIndexRef.current = undefined;
  }, [scrollToRow, virtualizer]);
};
