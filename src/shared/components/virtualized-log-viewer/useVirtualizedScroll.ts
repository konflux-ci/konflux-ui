import React from 'react';
import { Virtualizer } from '@tanstack/react-virtual';

interface UseVirtualizedScrollParams {
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  scrollToRow?: number;
  totalCount: number;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
}

// Duration for smooth scroll animation to settle (ms)
const SCROLL_ANIMATION_DURATION_MS = 300;

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
  totalCount,
  onScroll,
}: UseVirtualizedScrollParams) => {
  const prevScrollOffset = React.useRef<number>(0);
  const scrollToIndexRef = React.useRef<number | undefined>(undefined);
  const lastScrollDirection = React.useRef<'forward' | 'backward'>('forward');

  // Track scroll offset changes and trigger onScroll callback
  const scrollOffset = virtualizer.scrollOffset ?? 0;

  React.useEffect(() => {
    // Determine scroll direction
    const scrollDirection: 'forward' | 'backward' =
      scrollOffset >= prevScrollOffset.current ? 'forward' : 'backward';

    lastScrollDirection.current = scrollDirection;

    if (onScroll) {
      // Match PatternFly LogViewer semantics:
      // scrollUpdateWasRequested is true when user manually scrolls (NOT programmatic)
      // This is opposite to what the name suggests, but matches PatternFly behavior
      const scrollUpdateWasRequested = scrollToIndexRef.current === undefined;

      onScroll({
        scrollDirection,
        scrollOffset,
        scrollUpdateWasRequested,
      });
    }

    prevScrollOffset.current = scrollOffset;
  }, [scrollOffset, onScroll]);

  // Scroll to specific row when scrollToRow changes
  React.useEffect(() => {
    if (scrollToRow !== undefined && scrollToRow > 0) {
      const targetIndex = scrollToRow - 1;
      scrollToIndexRef.current = targetIndex;
      virtualizer.scrollToIndex(targetIndex, { align: 'center' });

      // Clear the flag after scroll animation completes
      const timer = setTimeout(() => {
        scrollToIndexRef.current = undefined;
      }, SCROLL_ANIMATION_DURATION_MS);

      return () => clearTimeout(timer);
    }

    // Clear the flag immediately when scrollToRow becomes undefined/0
    scrollToIndexRef.current = undefined;
  }, [scrollToRow, virtualizer]);

  // Handle near-bottom scrolling: when user gets close to bottom but hasn't reached
  // the actual last item, snap to the true bottom to ensure all lines are visible
  React.useEffect(() => {
    const scrollElement = virtualizer.scrollElement;
    if (!scrollElement || totalCount === 0) return;

    let rafId: number | undefined;

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        // Skip if programmatic scroll is active
        if (scrollToIndexRef.current !== undefined) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const scrollBottom = scrollTop + clientHeight;
        const distanceFromBottom = scrollHeight - scrollBottom;

        // Check if user is trying to scroll down and is close to estimated bottom
        const isScrollingDown = lastScrollDirection.current === 'forward';
        const isNearBottom = distanceFromBottom < 200; // Within 200px of estimated bottom

        const range = virtualizer.range;
        const hasUnrenderedItems = range && range.endIndex < totalCount - 1;

        if (isScrollingDown && isNearBottom && hasUnrenderedItems) {
          // Mark as programmatic scroll
          scrollToIndexRef.current = totalCount - 1;

          // First, try scrollToIndex to render the last items
          virtualizer.scrollToIndex(totalCount - 1, { align: 'end' });

          // Then, use direct scrollTop manipulation to ensure we reach the true bottom
          // Use RAF to let virtualizer update first
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (scrollElement) {
                const maxScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight;
                scrollElement.scrollTop = maxScrollTop;
              }
            });
          });

          // Clear flag after scroll completes
          setTimeout(() => {
            scrollToIndexRef.current = undefined;
          }, SCROLL_ANIMATION_DURATION_MS);
        }
      });
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [virtualizer, totalCount]);
};
