import React from 'react';
import { Virtualizer } from '@tanstack/react-virtual';

export interface LineNumberGutterProps {
  height: number;
  selectedLines: { start: number; end: number } | null;
  onLineClick: (lineNumber: number, isRange: boolean) => void;
  parentVirtualizer: Virtualizer<HTMLDivElement, Element>;
  scrollOffset: number;
}

export const LineNumberGutter: React.FC<LineNumberGutterProps> = ({
  height,
  selectedLines,
  onLineClick,
  parentVirtualizer,
  scrollOffset,
}) => {
  // Use scrollOffset prop to ensure re-renders on scroll
  // Get fresh virtual items on every render
  // This is fast because @tanstack/react-virtual caches the calculation
  const totalSize = parentVirtualizer.getTotalSize();
  const virtualItems = parentVirtualizer.getVirtualItems();

  return (
    <div
      className="log-viewer__gutter"
      style={{
        height: `${height}px`,
        width: '60px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
          transform: `translateY(${-scrollOffset}px)`,
          willChange: 'transform',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const lineNumber = virtualItem.index + 1;
          const isSelected =
            selectedLines && lineNumber >= selectedLines.start && lineNumber <= selectedLines.end;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              className={`log-viewer__line-number ${isSelected ? 'log-viewer__line-number--selected' : ''}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              onClick={(e) => onLineClick(lineNumber, e.shiftKey)}
            >
              {lineNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
};
