import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Highlight, Language, PrismTheme, Prism } from 'prism-react-renderer';
import type { Grammar } from 'prismjs';

// Define custom log language for Prism
(Prism.languages as Record<string, Grammar>).log = {
  // Key-value pairs must come first to match before other rules
  'key-value': {
    pattern: /(^|[\s])(-{0,2}\w+)=(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s=]+)/,
    greedy: true,
    lookbehind: true,
    inside: {
      key: {
        pattern: /^-{0,2}\w+/,
        alias: 'attr-name',
      },
      punctuation: /=/,
      value: {
        pattern: /(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s=]+)$/,
        alias: 'string',
      },
    },
  },
  timestamp: {
    pattern: /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/,
    alias: 'number',
  },
  'level-error': {
    pattern: /\b(?:ERROR|FATAL|CRITICAL|FAIL|Failed|failed)\b/,
    alias: 'important',
  },
  'level-warn': {
    pattern: /\b(?:WARN|WARNING|CAUTION)\b/,
    alias: 'warning',
  },
  'level-info': {
    pattern: /\b(?:INFO|INF|INFORMATION)\b/,
    alias: 'keyword',
  },
  'level-debug': {
    pattern: /\b(?:DEBUG|DBG|TRACE|VERBOSE)\b/,
    alias: 'comment',
  },
  'result-success': {
    pattern: /\b(?:PASSED|PASS|SUCCESS|SUCCESSFUL|OK)\b/,
    alias: 'inserted',
  },
  'result-failure': {
    pattern: /\b(?:FAILED|FAILURE)\b/,
    alias: 'deleted',
  },
};

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
  selectedLines?: { start: number; end: number } | null;
  onItemSizeMeasured?: (size: number) => void;
  language?: Language; // Language for syntax highlighting
  prismTheme?: PrismTheme; // Prism theme object for syntax highlighting
}

interface RowData {
  lines: string[];
  searchText?: string;
  currentSearchMatch?: SearchedWord;
  escapedSearchText?: string;
  searchRegex?: RegExp;
  selectedLines?: { start: number; end: number } | null;
  language?: Language;
  prismTheme?: PrismTheme;
}

const Row: React.FC<ListChildComponentProps<RowData>> = ({ index, style, data }) => {
  const line = data.lines[index];
  const {
    searchText,
    currentSearchMatch,
    escapedSearchText,
    searchRegex,
    selectedLines,
    language,
    prismTheme,
  } = data;
  const lineNumber = index + 1;

  const isLineSelected =
    selectedLines && lineNumber >= selectedLines.start && lineNumber <= selectedLines.end;

  // Create test regex once per row (case-insensitive for matching)
  const testRegex = React.useMemo(
    () => (escapedSearchText ? new RegExp(escapedSearchText, 'i') : null),
    [escapedSearchText],
  );

  // Render line with syntax highlighting and search matches
  const renderLine = () => {
    // Apply syntax highlighting if language and theme are specified
    if (language && prismTheme) {
      return (
        <Highlight theme={prismTheme} code={line} language={language}>
          {({ tokens, getTokenProps }) => {
            // If no search text, just render highlighted tokens
            if (!searchText || searchText.length < 2 || !escapedSearchText || !searchRegex) {
              return (
                <span className="pf-v5-c-log-viewer__text">
                  {tokens[0]?.map((token, i) => <span key={i} {...getTokenProps({ token })} />)}
                </span>
              );
            }

            // With search: apply search highlighting on top of syntax highlighting
            let matchIndexInLine = 1;

            return (
              <span className="pf-v5-c-log-viewer__text">
                {tokens[0]?.map((token, i) => {
                  const { style: tokenStyle, ...otherProps } = getTokenProps({ token });
                  const content = token.content;
                  const parts: string[] = content.split(searchRegex);

                  if (parts.length === 1) {
                    return <span key={i} style={tokenStyle} {...otherProps} />;
                  }

                  return (
                    <span key={i} style={tokenStyle}>
                      {parts.map((part: string, j) => {
                        if (testRegex && testRegex.test(part)) {
                          const isCurrentMatch =
                            currentSearchMatch?.rowIndex === index &&
                            currentSearchMatch?.matchIndex === matchIndexInLine;
                          matchIndexInLine++;
                          return (
                            <mark
                              key={j}
                              className={`pf-v5-c-log-viewer__string pf-m-match ${isCurrentMatch ? 'pf-m-current' : ''}`}
                            >
                              {part}
                            </mark>
                          );
                        }
                        return <span key={j}>{part}</span>;
                      })}
                    </span>
                  );
                })}
              </span>
            );
          }}
        </Highlight>
      );
    }

    // No syntax highlighting: plain text with search highlighting
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
    <div
      style={style}
      className={`pf-v5-c-log-viewer__list-item ${isLineSelected ? 'log-viewer__line--selected' : ''}`}
    >
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
  selectedLines,
  onItemSizeMeasured,
  language,
  prismTheme,
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
        onItemSizeMeasured?.(measured);
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
    selectedLines,
    language,
    prismTheme,
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
