import type { RefObject } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

const DEFAULT_LINE_HEIGHT = 20;

interface UseKeyboardNavigationParams {
  scrollElementRef: RefObject<HTMLDivElement>;
  lineHeight?: number;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  scrollElementRef,
  lineHeight = DEFAULT_LINE_HEIGHT,
  enabled = true,
}: UseKeyboardNavigationParams): RefObject<HTMLDivElement | null> => {
  return useHotkeys<HTMLDivElement>(
    'up,down,pageup,pagedown,home,end',
    (event) => {
      const scrollElement = scrollElementRef.current;
      if (!scrollElement) return;

      event.preventDefault();
      event.stopPropagation();

      const current = scrollElement.scrollTop;
      const viewport = scrollElement.clientHeight;
      const total = scrollElement.scrollHeight;

      let next = current;

      switch (event.key) {
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
          break;
      }

      scrollElement.scrollTop = Math.max(0, next);
    },
    { enabled },
  );
};
