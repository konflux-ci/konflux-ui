import React from 'react';
import { Flex } from '@patternfly/react-core';
import type { VirtualItem } from '@tanstack/react-virtual';
import { getDisplayLineNumber, type VirtualLine } from './useLargeLineHandler';

import './LineNumberGutter.scss';

export interface LineNumberGutterProps {
  /** Virtual items from the virtualizer */
  virtualItems: VirtualItem[];
  /** Height of each line in pixels */
  itemSize: number;
  /** Callback when a line number is clicked */
  onLineClick: (lineNumber: number, event: React.MouseEvent) => void;
  /** Function to check if a line is highlighted */
  isLineHighlighted: (lineNumber: number) => boolean;
  /** Function to get original line info from virtual line index */
  getOriginalLineInfo: (virtualLineIndex: number) => VirtualLine | null;
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
  getOriginalLineInfo,
}) => {
  return (
    <Flex className="line-number__gutter" direction={{ default: 'column' }}>
      {virtualItems.map((virtualItem) => {
        const virtualLineInfo = getOriginalLineInfo(virtualItem.index);
        const lineNumber = getDisplayLineNumber(virtualLineInfo, virtualItem.index);
        const isHighlighted = isLineHighlighted(lineNumber);

        // For split text chunks, show "line.chunk" format (e.g., "5.2")
        // For formatted JSON and normal lines, show the line number directly
        const displayLineNumber =
          virtualLineInfo?.isSplit && !virtualLineInfo.isFormatted
            ? `${lineNumber}.${virtualLineInfo.subLineIndex + 1}` // Chunks: "5.1", "5.2"...
            : lineNumber.toString(); // Normal lines and formatted JSON: "2", "3", "4"...

        return (
          <div
            key={`gutter-${virtualItem.key}`}
            className={`line-number__gutter-cell ${isHighlighted ? 'line-number__gutter-cell--highlighted' : ''}`}
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
              className="line-number__line-number"
              aria-label={`Jump to line ${lineNumber}`}
              onClick={(e) => {
                e.preventDefault();
                onLineClick(lineNumber, e);
              }}
              data-line-number={lineNumber}
              title={
                virtualLineInfo?.isSplit
                  ? virtualLineInfo.isFormatted
                    ? `Auto-formatted from line ${virtualLineInfo.originalLineIndex + 1} (${virtualLineInfo.totalSubLines} lines total)`
                    : `Line ${virtualLineInfo.originalLineIndex + 1}, chunk ${virtualLineInfo.subLineIndex + 1}/${virtualLineInfo.totalSubLines}`
                  : undefined
              }
            >
              {displayLineNumber}
            </a>
          </div>
        );
      })}
    </Flex>
  );
};
