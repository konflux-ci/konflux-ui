import { useEffect } from 'react';

/** Minimal virtual item shape needed for scroll detection. */
interface VirtualItem {
  index: number;
}

/** Options for the {@link useInfiniteScroll} hook. */
interface UseInfiniteScrollOptions {
  /** The current virtual items from the virtualizer. Changes trigger re-evaluation. */
  virtualRows: VirtualItem[];
  /** Total number of rows in the data set. */
  totalCount: number;
  /** Whether more data is available to fetch. */
  hasNextPage: boolean;
  /** Whether a fetch is currently in progress. Guards against double-fetch. */
  isFetchingNextPage: boolean;
  /** Callback to trigger fetching the next page. */
  fetchNextPage: () => void;
  /** The scroll container element. Required for scroll-position detection. */
  scrollElement: HTMLElement | null;
  /**
   * Number of rows from the end at which to trigger a fetch.
   * Defaults to `5`.
   */
  threshold?: number;
}

/**
 * Triggers infinite scroll data fetching when the user scrolls near the
 * bottom of a virtualized list.
 *
 * Detection logic: listens to scroll events on `scrollElement` and checks
 * two conditions before fetching:
 * 1. The content overflows (has a scrollbar) and the user has scrolled near
 *    the bottom (within 200px).
 * 2. The last visible virtual item's index is within `threshold` rows of
 *    the total row count.
 *
 * If all content fits without scrolling (no scrollbar), no fetch is triggered
 * — the user must scroll to load more.
 *
 * Guards against double-fetch via the `isFetchingNextPage` flag.
 *
 * @param options - Infinite scroll configuration
 *
 * @example
 * ```tsx
 * useInfiniteScroll({
 *   virtualRows,
 *   totalCount: rows.length,
 *   hasNextPage: !!query.hasNextPage,
 *   isFetchingNextPage: query.isFetchingNextPage,
 *   fetchNextPage: query.fetchNextPage,
 *   scrollElement,
 * });
 * ```
 */
export const useInfiniteScroll = (options: UseInfiniteScrollOptions): void => {
  const {
    virtualRows,
    totalCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollElement,
    threshold = 5,
  } = options;

  // Derive a stable primitive from virtualRows to avoid effect re-registration
  // on every render (virtualRows is a new array reference each time).
  const lastVirtualIndex = virtualRows.length > 0 ? virtualRows[virtualRows.length - 1].index : -1;

  useEffect(() => {
    if (!scrollElement || !hasNextPage || isFetchingNextPage) return;

    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = scrollElement;

      // If no overflow (no scrollbar), don't trigger — user needs to scroll
      if (scrollHeight <= clientHeight) return;

      // Check if scrolled near the bottom (within 200px)
      const nearBottom = scrollTop + clientHeight >= scrollHeight - 200;
      if (!nearBottom) return;

      // Also check virtual items as a secondary guard
      if (lastVirtualIndex < 0) return;
      if (lastVirtualIndex >= totalCount - threshold) {
        fetchNextPage();
      }
    };

    // Check immediately in case we're already scrolled to bottom
    handleScroll();

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [
    scrollElement,
    lastVirtualIndex,
    totalCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold,
  ]);
};
