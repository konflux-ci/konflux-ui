import { useVirtualizer } from '@tanstack/react-virtual';

/** Options for the {@link useVirtualization} hook. */
interface UseVirtualizationOptions {
  /** Total number of rows to virtualize. */
  count: number;
  /** Estimated row height in pixels. Defaults to `44`. */
  estimateSize?: number;
  /** Number of rows to render outside the visible viewport. Defaults to `10`. */
  overscan?: number;
  /** The scrollable container element. Virtualization is inactive while `null`. */
  scrollElement: HTMLElement | null;
}

/**
 * Wraps TanStack Virtual's `useVirtualizer` with sensible defaults for TableV2.
 *
 * Provides row-level virtualization so only visible rows (plus an overscan
 * buffer) are rendered in the DOM, keeping large tables performant.
 *
 * Uses `measureElement` to dynamically measure actual row heights after render,
 * so rows with variable content are handled correctly.
 *
 * @param options - Virtualization configuration
 * @returns An object with the `virtualizer` instance and the current `virtualRows`
 *
 * @example
 * ```tsx
 * const { virtualizer, virtualRows } = useVirtualization({
 *   count: rows.length,
 *   scrollElement: containerRef.current,
 * });
 * ```
 */
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
