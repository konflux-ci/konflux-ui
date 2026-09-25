import * as React from 'react';

/**
 * Returns a ref to place at the end of a scrollable list. Scrolls that
 * element into view whenever `dependency` changes (e.g. a messages array).
 */
export const useScrollToBottom = (
  dependency: unknown,
): React.RefObject<HTMLDivElement | null> => {
  const scrollToBottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollToBottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [dependency]);

  return scrollToBottomRef;
};
