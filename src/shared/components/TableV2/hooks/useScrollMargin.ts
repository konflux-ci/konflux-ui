import { useCallback, useState } from 'react';
import { useLayoutResizeObserver } from '~/shared/hooks';

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

  const recalculate = useCallback(() => {
    if (!tableNode || !scrollElement) {
      setScrollMargin(0);
      return;
    }
    const tableRect = tableNode.getBoundingClientRect();
    const scrollRect = scrollElement.getBoundingClientRect();
    setScrollMargin(tableRect.top - scrollRect.top + scrollElement.scrollTop);
  }, [tableNode, scrollElement]);

  useLayoutResizeObserver(recalculate, [tableNode, scrollElement]);

  return scrollMargin;
};
