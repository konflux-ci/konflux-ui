import { useLayoutEffect, useState } from 'react';

/**
 * Measures the distance from the top of the scroll container to the table so
 * the virtualizer can correctly offset row positions (accounts for toolbars,
 * headers, tabs, etc.).
 *
 * Recalculates on mount and whenever either element is resized.
 *
 * @param tableNode - The table wrapper element
 * @param scrollElement - The scrollable container element
 * @returns Distance in pixels from the scroll container top to the table top
 */
export const useScrollMargin = (
  tableNode: HTMLElement | null,
  scrollElement: HTMLElement | null,
): number => {
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    if (!tableNode || !scrollElement) {
      setScrollMargin(0);
      return;
    }

    const recalculate = () => {
      const tableRect = tableNode.getBoundingClientRect();
      const scrollRect = scrollElement.getBoundingClientRect();
      setScrollMargin(tableRect.top - scrollRect.top + scrollElement.scrollTop);
    };

    recalculate();

    const observer = new ResizeObserver(recalculate);
    observer.observe(scrollElement);
    observer.observe(tableNode);

    return () => observer.disconnect();
  }, [tableNode, scrollElement]);

  return scrollMargin;
};
