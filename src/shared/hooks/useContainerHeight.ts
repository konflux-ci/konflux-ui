import { useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash-es';

type UseContainerHeightReturn = {
  containerRef: React.RefObject<HTMLDivElement>;
  viewerHeight: number | undefined;
};

export const useContainerHeight = (): UseContainerHeightReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewerHeight, setViewerHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateHeight = (immediate = false) => {
      if (containerRef.current) {
        const measured = containerRef.current.clientHeight;
        if (measured > 0) {
          if (immediate) {
            // Immediate update for fullscreen toggle and initial mount
            setViewerHeight(measured);
          } else {
            // Use requestAnimationFrame for resize events to avoid ResizeObserver warnings
            requestAnimationFrame(() => {
              setViewerHeight(measured);
            });
          }
        }
      }
    };

    // Update immediately on mount and fullscreen changes
    updateHeight(true);

    // Debounced resize handler for better performance (150ms delay)
    const debouncedUpdateHeight = debounce(() => updateHeight(false), 150);

    // Update on window resize
    window.addEventListener('resize', debouncedUpdateHeight);
    return () => {
      window.removeEventListener('resize', debouncedUpdateHeight);
      debouncedUpdateHeight.cancel();
    };
  }, []);

  return useMemo(() => ({ containerRef, viewerHeight }), [viewerHeight]);
};

export default useContainerHeight;
