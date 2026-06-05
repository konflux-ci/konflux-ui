import { useVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualizationOptions {
  count: number;
  estimateSize?: number;
  overscan?: number;
  scrollElement: HTMLElement | null;
}

export const useVirtualization = (options: UseVirtualizationOptions) => {
  const { count, estimateSize = 44, overscan = 10, scrollElement } = options;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  return {
    virtualizer,
    virtualRows: virtualizer.getVirtualItems(),
  };
};
