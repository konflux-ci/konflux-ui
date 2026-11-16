import * as React from 'react';

/** Scrolls a ref target into view whenever `dependency` changes. */
export const useScrollToBottom = (dependency: unknown): React.RefObject<HTMLDivElement | null> => {
  const scrollToBottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollToBottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [dependency]);

  return scrollToBottomRef;
};
