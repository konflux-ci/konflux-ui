import { useCallback, useMemo, useRef, useState } from 'react';
import { useResizeObserver } from './useResizeObserver';

type UseContainerHeightReturn = {
  containerRef: React.RefObject<HTMLDivElement>;
  viewerHeight: number | undefined;
};

export const useContainerHeight = (): UseContainerHeightReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewerHeight, setViewerHeight] = useState<number | undefined>(undefined);

  const handleResize = useCallback<ResizeObserverCallback>((entries) => {
    const height = entries[0]?.contentRect.height;
    if (height > 0) {
      setViewerHeight(height);
    }
  }, []);

  useResizeObserver(handleResize, containerRef.current);

  return useMemo(() => ({ containerRef, viewerHeight }), [viewerHeight]);
};
