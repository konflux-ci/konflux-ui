import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

interface SearchedWord {
  rowIndex: number;
  matchIndex: number;
}

export interface VirtualizedLogContentProps {
  data: string;
  height: number;
  width: string | number;
  scrollToRow?: number;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
  searchText?: string;
  currentSearchMatch?: SearchedWord;
}

interface RowData {
  lines: string[];
  searchText?: string;
  currentSearchMatch?: SearchedWord;
  escapedSearchText?: string;
  searchRegex?: RegExp;
}

const Row: React.FC<ListChildComponentProps<RowData>> = ({ index, style, data }) => {
  const line = data.lines[index];
  const { searchText, currentSearchMatch, escapedSearchText, searchRegex } = data;

  // Create test regex once per row (case-insensitive for matching)
  const testRegex = React.useMemo(
    () => (escapedSearchText ? new RegExp(escapedSearchText, 'i') : null),
    [escapedSearchText],
  );

  // Highlight search matches
  const renderLine = () => {
    if (!searchText || searchText.length < 2 || !escapedSearchText || !searchRegex || !testRegex) {
      return <span className="pf-v5-c-log-viewer__text">{line}</span>;
    }

    const parts: string[] = line.split(searchRegex);
    let matchIndexInLine = 1; // PatternFly uses 1-based indexing

    return (
      <span className="pf-v5-c-log-viewer__text">
        {parts.map((part: string, i: number) => {
          if (testRegex.test(part)) {
            const isCurrentMatch =
              currentSearchMatch?.rowIndex === index &&
              currentSearchMatch?.matchIndex === matchIndexInLine;
            matchIndexInLine++;
            return (
              <mark
                key={i}
                className={`pf-v5-c-log-viewer__string pf-m-match ${isCurrentMatch ? 'pf-m-current' : ''}`}
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div style={style} className="pf-v5-c-log-viewer__list-item">
      {renderLine()}
    </div>
  );
};

export const VirtualizedLogContent: React.FC<VirtualizedLogContentProps> = ({
  data,
  height,
  width,
  scrollToRow,
  onScroll,
  searchText = '',
  currentSearchMatch,
}) => {
  const listRef = React.useRef<FixedSizeList>(null);
  const prevScrollOffset = React.useRef<number>(0);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [itemSize, setItemSize] = React.useState(20);

  // Split data into lines
  const lines = React.useMemo(() => data.split('\n'), [data]);

  // Pre-compute search regex once for all rows
  const escapedSearchText = React.useMemo(() => {
    if (!searchText || searchText.length < 2) return undefined;
    return searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, [searchText]);

  const searchRegex = React.useMemo(() => {
    if (!escapedSearchText) return undefined;
    return new RegExp(`(${escapedSearchText})`, 'gi');
  }, [escapedSearchText]);

  // Measure actual line height from PatternFly CSS
  React.useEffect(() => {
    if (measureRef.current) {
      const measured = measureRef.current.offsetHeight;
      if (measured > 0 && measured !== itemSize) {
        setItemSize(measured);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to specific row when scrollToRow changes
  React.useEffect(() => {
    if (scrollToRow !== undefined && scrollToRow > 0 && listRef.current) {
      listRef.current.scrollToItem(scrollToRow - 1, 'start');
    }
  }, [scrollToRow]);

  const handleScroll = ({
    scrollOffset,
    scrollUpdateWasRequested,
  }: {
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => {
    if (!onScroll) return;

    // Determine scroll direction
    const scrollDirection: 'forward' | 'backward' =
      scrollOffset >= prevScrollOffset.current ? 'forward' : 'backward';

    prevScrollOffset.current = scrollOffset;

    onScroll({
      scrollDirection,
      scrollOffset,
      scrollUpdateWasRequested,
    });
  };

  const itemData: RowData = {
    lines,
    searchText,
    currentSearchMatch,
    escapedSearchText,
    searchRegex,
  };

  return (
    <>
      {/* Hidden element to measure actual line height from PatternFly CSS */}
      <div
        ref={measureRef}
        className="pf-v5-c-log-viewer__list-item"
        style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
      >
        <span className="pf-v5-c-log-viewer__text">M</span>
      </div>
      <FixedSizeList
        ref={listRef}
        height={height}
        width={width}
        itemCount={lines.length}
        itemSize={itemSize} // Dynamically measured from PatternFly CSS
        itemData={itemData}
        onScroll={handleScroll}
        overscanCount={10} // To prevent visual flickering during fast scrolling
        className="pf-v5-c-log-viewer__list"
      >
        {Row}
      </FixedSizeList>
    </>
  );
};
