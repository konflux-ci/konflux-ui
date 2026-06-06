import { useEffect } from 'react';

/** Minimal virtual item shape needed for scroll detection. */
interface VirtualItem {
  index: number;
}

/** Minimal virtualizer shape needed for scroll detection. */
interface VirtualizerLike {
  getVirtualItems: () => VirtualItem[];
  options: { count: number };
}

/** Options for the {@link useInfiniteScroll} hook. */
interface UseInfiniteScrollOptions {
  /** The virtualizer instance from `useVirtualization`. */
  virtualizer: VirtualizerLike;
  /** Whether more data is available to fetch. */
  hasNextPage: boolean;
  /** Whether a fetch is currently in progress. Guards against double-fetch. */
  isFetchingNextPage: boolean;
  /** Callback to trigger fetching the next page. */
  fetchNextPage: () => void;
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
 * Detection logic: after each render, checks whether the last visible virtual
 * item's index is within `threshold` rows of the total row count. If so, and
 * `hasNextPage` is `true` and no fetch is in progress, calls `fetchNextPage`.
 *
 * Guards against double-fetch via the `isFetchingNextPage` flag.
 *
 * @param options - Infinite scroll configuration
 *
 * @example
 * ```tsx
 * useInfiniteScroll({
 *   virtualizer,
 *   hasNextPage: !!query.hasNextPage,
 *   isFetchingNextPage: query.isFetchingNextPage,
 *   fetchNextPage: query.fetchNextPage,
 * });
 * ```
 */
export const useInfiniteScroll = (options: UseInfiniteScrollOptions): void => {
  const { virtualizer, hasNextPage, isFetchingNextPage, fetchNextPage, threshold = 5 } = options;

  useEffect(() => {
    const items = virtualizer.getVirtualItems();
    const lastItem = items[items.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= virtualizer.options.count - threshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualizer, hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);
};
