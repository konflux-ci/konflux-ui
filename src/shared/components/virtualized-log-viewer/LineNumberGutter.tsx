import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

interface LineNumberGutterProps {
  lineCount: number;
  height: number;
  lineHeight: number;
  selectedLines: { start: number; end: number } | null;
  onLineClick: (lineNumber: number, isRange: boolean) => void;
  scrollOffset: number;
}

interface LineNumberRowData {
  selectedLines: { start: number; end: number } | null;
  onLineClick: (lineNumber: number, isRange: boolean) => void;
}

const LineNumberRow: React.FC<ListChildComponentProps<LineNumberRowData>> = ({
  index,
  style,
  data,
}) => {
  const lineNumber = index + 1;
  const { selectedLines, onLineClick } = data;

  const isSelected =
    selectedLines && lineNumber >= selectedLines.start && lineNumber <= selectedLines.end;

  const handleClick = (e: React.MouseEvent) => {
    onLineClick(lineNumber, e.shiftKey);
  };

  return (
    <div
      style={style}
      className={`log-viewer__line-number ${isSelected ? 'log-viewer__line-number--selected' : ''}`}
      onClick={handleClick}
    >
      {lineNumber}
    </div>
  );
};

export const LineNumberGutter: React.FC<LineNumberGutterProps> = ({
  lineCount,
  height,
  lineHeight,
  selectedLines,
  onLineClick,
  scrollOffset,
}) => {
  const listRef = React.useRef<FixedSizeList>(null);

  // Sync scroll with main content
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(scrollOffset);
    }
  }, [scrollOffset]);

  const itemData: LineNumberRowData = {
    selectedLines,
    onLineClick,
  };

  return (
    <FixedSizeList
      ref={listRef}
      height={height}
      width={60}
      itemCount={lineCount}
      itemSize={lineHeight}
      itemData={itemData}
      className="log-viewer__gutter"
      style={{ overflow: 'hidden' }}
    >
      {LineNumberRow}
    </FixedSizeList>
  );
};
