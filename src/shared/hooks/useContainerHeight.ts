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
    const target = entries[0]?.target as HTMLElement | undefined;
    if (!target) return;
    const maxHeight = window.innerHeight - target.getBoundingClientRect().top;
    const height = Math.min(target.clientHeight, maxHeight);
    if (height > 0) {
      setViewerHeight(height);
    }
  }, []);

  useResizeObserver(handleResize, container);

  return useMemo(() => ({ containerRef: setContainer, viewerHeight }), [viewerHeight]);
};
