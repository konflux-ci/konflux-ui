import { useCallback, useMemo, useState } from 'react';
import { useLayoutResizeObserver } from './useLayoutResizeObserver';

type UseContainerHeightReturn = {
  containerRef: React.RefCallback<HTMLDivElement>;
  containerHeight: number | undefined;
};

export const useContainerHeight = (): UseContainerHeightReturn => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);

  const handleResize = useCallback(() => {
    if (!container) return;
    const maxHeight = window.innerHeight - container.getBoundingClientRect().top;
    const height = Math.min(container.clientHeight, maxHeight);
    if (height > 0) {
      setContainerHeight(height);
    }
  }, [container]);

  useLayoutResizeObserver(handleResize, [container]);

  return useMemo(() => ({ containerRef: setContainer, containerHeight }), [containerHeight]);
};
