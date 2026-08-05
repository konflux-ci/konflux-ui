import { useEffect, useMemo, useRef, useState } from 'react';

type UseContainerHeightReturn = {
  containerRef: React.RefObject<HTMLDivElement>;
  viewerHeight: number | undefined;
};

type Props = {
  isFullscreen: boolean;
};

export const useContainerHeight = ({ isFullscreen }: Props): UseContainerHeightReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewerHeight, setViewerHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height > 0) {
        setViewerHeight(height);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [isFullscreen]);

  return useMemo(() => ({ containerRef, viewerHeight }), [viewerHeight]);
};
