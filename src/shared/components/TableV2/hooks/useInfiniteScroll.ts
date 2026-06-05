import { useEffect } from 'react';

interface VirtualItem {
  index: number;
}

interface VirtualizerLike {
  getVirtualItems: () => VirtualItem[];
  options: { count: number };
}

interface UseInfiniteScrollOptions {
  virtualizer: VirtualizerLike;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  threshold?: number;
}

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
