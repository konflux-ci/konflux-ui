import React from 'react';
import { Flex } from '@patternfly/react-core';
import type { VirtualItem } from '@tanstack/react-virtual';

export interface LineNumberGutterProps {
  /** Virtual items from the virtualizer */
  virtualItems: VirtualItem[];
  /** Height of each line in pixels */
  itemSize: number;
  /** Callback when a line number is clicked */
  onLineClick: (lineNumber: number, event: React.MouseEvent) => void;
  /** Function to check if a line is highlighted */
  isLineHighlighted: (lineNumber: number) => boolean;
}

/**
 * Line number gutter component for log viewer
 *
 * Displays clickable line numbers in a sticky left column.
 * Supports single line and range selection via shift-click.
 */
export const LineNumberGutter: React.FC<LineNumberGutterProps> = ({
  virtualItems,
  itemSize,
  onLineClick,
  isLineHighlighted,
}) => {
  return (
    <Flex className="log-viewer__gutter" direction={{ default: 'column' }}>
      {virtualItems.map((virtualItem) => {
        const lineNumber = virtualItem.index + 1;
        const isHighlighted = isLineHighlighted(lineNumber);
        return (
          <div
            key={`gutter-${virtualItem.key}`}
            className={`log-viewer__gutter-cell ${isHighlighted ? 'log-viewer__gutter-cell--highlighted' : ''}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: `${itemSize}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <a
              href={`#L${lineNumber}`}
              className="log-viewer__line-number"
              aria-label={`Jump to line ${lineNumber}`}
              onClick={(e) => {
                e.preventDefault();
                onLineClick(lineNumber, e);
              }}
              data-line-number={lineNumber}
            >
              {lineNumber}
            </a>
          </div>
        );
      })}
    </Flex>
  );
};
