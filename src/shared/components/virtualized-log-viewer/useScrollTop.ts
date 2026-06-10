import React from 'react';

/** Tracks scroll offset for sticky headers. Must run before virtualizer.getVirtualItems(). */
export function useScrollTop(
  scrollElementRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
): number {
  const [scrollTop, setScrollTop] = React.useState(0);

  React.useEffect(() => {
    const el = scrollElementRef.current;
    if (!el || !enabled) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [enabled, scrollElementRef]);

  return scrollTop;
}
