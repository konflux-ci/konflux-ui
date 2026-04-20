import React from 'react';
import { Virtualizer } from '@tanstack/react-virtual';

interface UseKeyboardNavigationParams {
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  scrollElementRef: React.RefObject<HTMLDivElement>;
  enabled?: boolean;
}

const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);

export const useKeyboardNavigation = ({
  virtualizer,
  scrollElementRef,
  enabled = true,
}: UseKeyboardNavigationParams) => {
  React.useEffect(() => {
    if (!enabled) return;

    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement;

      if (!active || (active !== scrollElement && !scrollElement.contains(active))) {
        return;
      }

      const { key } = event;
      if (!NAV_KEYS.has(key)) return;

      event.preventDefault();
      event.stopPropagation();

      const current = scrollElement.scrollTop;
      const viewport = scrollElement.clientHeight;
      const total = virtualizer.getTotalSize();
      const lineHeight = virtualizer.options.estimateSize?.(0) ?? 20;

      const maxScroll = Math.max(0, total - viewport);

      let next = current;

      switch (key) {
        case 'ArrowUp':
          next = current - lineHeight;
          break;
        case 'ArrowDown':
          next = current + lineHeight;
          break;
        case 'PageUp':
          next = current - viewport;
          break;
        case 'PageDown':
          next = current + viewport;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = total;
          break;
        default:
          // do nothing
          break;
      }

      if (key === 'End') {
        scrollElement.scrollTop = total;
      } else if (key === 'PageDown') {
        scrollElement.scrollTop = Math.min(total, next);
      } else {
        scrollElement.scrollTop = Math.min(maxScroll, Math.max(0, next));
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, scrollElementRef, virtualizer]);
};
