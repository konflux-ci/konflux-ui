import { useCallback, useMemo, useState } from 'react';
import { useResizeObserver } from './useResizeObserver';

type UseContainerHeightReturn = {
  containerRef: React.RefCallback<HTMLDivElement>;
  viewerHeight: number | undefined;
};

export const useContainerHeight = (): UseContainerHeightReturn => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [viewerHeight, setViewerHeight] = useState<number | undefined>(undefined);

  const handleResize = useCallback<ResizeObserverCallback>((entries) => {
    const height = entries[0]?.contentRect.height;
    if (height > 0) {
      setViewerHeight(height);
    }
  }, []);

  useResizeObserver(handleResize, container);

  return useMemo(() => ({ containerRef: setContainer, viewerHeight }), [viewerHeight]);
};
