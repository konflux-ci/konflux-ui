import React from 'react';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LineNumberGutter } from './LineNumberGutter';
import type { LogSection, SectionHeaderRow, SearchedWord } from './types';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { useLineNumberNavigation } from './useLineNumberNavigation';
import { useLineRenderer } from './useLineRenderer';
import { useResizeObserverFix } from './useResizeObserverFix';
import { useSearchRegex } from './useSearchRegex';
import { useSectionFold } from './useSectionFold';
import { useSectionRows } from './useSectionRows';
import { useTokenization } from './useTokenization';
import { useVirtualizedScroll } from './useVirtualizedScroll';
import {
  VIRTUALIZATION_CONFIG,
  getOverscanCount,
  getSafetyMargin,
  measureAverageCharWidth,
  calculateCharsPerLine,
} from './virtualization-utils';

import './VirtualizedLogContent.scss';

export interface VirtualizedLogContentProps {
  data: string;
  /** When provided, render in sectioned mode (VS Code-style foldable steps) */
  sections?: readonly LogSection[];
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

// ── Section-header row renderer ───────────────────────────────────────────────

const SectionHeader: React.FC<{ row: SectionHeaderRow; onToggle: () => void }> = ({
  row,
  onToggle,
}) => (
  <button
    className="log-content__section-header"
    onClick={onToggle}
    aria-expanded={row.isExpanded}
    data-test={`fold-header-${row.sectionName}`}
  >
    <span className="log-content__section-icon">
      {row.isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
    </span>
    <span className="log-content__section-name">
      {row.sectionName}
      {!row.isExpanded && (
        <span className="log-content__section-line-count">({row.lineCount} lines)</span>
      )}
    </span>
  </button>
);

// ── Fold-indicator row renderer ───────────────────────────────────────────────

const FoldIndicator: React.FC<{ lineCount: number }> = ({ lineCount }) => (
  <span className="log-content__fold-indicator">··· {lineCount} lines hidden</span>
);

export const VirtualizedLogContent: React.FC<VirtualizedLogContentProps> = ({
  data,
  sections,
  height,
  width,
  scrollToRow,
  onScroll,
  searchText = '',
  currentSearchMatch,
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [itemSize, setItemSize] = React.useState(VIRTUALIZATION_CONFIG.FALLBACK_LINE_HEIGHT);
  const avgCharWidthRef = React.useRef(VIRTUALIZATION_CONFIG.FALLBACK_CHAR_WIDTH);
  const charsPerLineRef = React.useRef(VIRTUALIZATION_CONFIG.FALLBACK_CHARS_PER_LINE);

  const isSectioned = (sections?.length ?? 0) > 0;

  // ── Sections mode: fold state + data transform ────────────────────────────
  const { expandedSections, toggleSection } = useSectionFold(sections ?? []);
  const {
    displayRows,
    allLines,
    searchLineToDisplayRow,
    searchLineToSection,
    lineNumberToDisplayRow,
  } = useSectionRows(sections ?? [], expandedSections);

  // ── Lines for tokenisation ────────────────────────────────────────────────
  // allLines is stable across fold/unfold; plainLines is used in plain mode
  const plainLines = React.useMemo(() => data.split('\n'), [data]);
  const lines = isSectioned ? allLines : plainLines;

  // ── Virtualizer count ─────────────────────────────────────────────────────
  const rowCount = isSectioned ? displayRows.length : plainLines.length;

  useResizeObserverFix();

  const deferredSearchText = React.useDeferredValue(searchText);
  const searchRegex = useSearchRegex(deferredSearchText);

  const { tokenizeLine } = useTokenization(lines);
  const renderLine = useLineRenderer({ tokenizeLine, searchRegex, currentSearchMatch });

  const measureCallbackRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const measured = node.offsetHeight;
      if (measured > 0) setItemSize(measured);
    }
  }, []);

  React.useEffect(() => {
    if (!parentRef.current) return;
    const container = parentRef.current;
    const rafId = requestAnimationFrame(() => {
      const style = getComputedStyle(container);
      const font = style.font || `${style.fontSize} ${style.fontFamily}`;
      avgCharWidthRef.current = measureAverageCharWidth(font);
      charsPerLineRef.current = calculateCharsPerLine(container, avgCharWidthRef.current);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  const estimateRowHeight = React.useCallback(
    (index: number): number => {
      if (itemSize === 0) return VIRTUALIZATION_CONFIG.FALLBACK_LINE_HEIGHT;
      if (isSectioned) {
        const row = displayRows[index];
        // Section headers and fold-indicators are single fixed-height rows
        if (!row || row.kind !== 'content') return itemSize;
        const text = allLines[row.flatLineIndex] || '';
        const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLineRef.current));
        return Math.ceil(itemSize * estimatedLines * getSafetyMargin(rowCount));
      }
      const text = lines[index] || '';
      const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLineRef.current));
      return Math.ceil(itemSize * estimatedLines * getSafetyMargin(lines.length));
    },
    [isSectioned, displayRows, allLines, itemSize, rowCount, lines],
  );

  const overscanCount = React.useMemo(() => getOverscanCount(rowCount), [rowCount]);

  const virtualizer = useVirtualizer<HTMLDivElement, Element>({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateRowHeight,
    overscan: overscanCount,
  });

  // ── Scroll target mapping ─────────────────────────────────────────────────
  // scrollToRow arrives as 1-indexed position in the search data space.
  // In sectioned mode, map it to a display-row index via searchLineToDisplayRow.
  const effectiveScrollToRow = React.useMemo(() => {
    if (isSectioned) {
      if (!scrollToRow || scrollToRow <= 0) return undefined;
      const displayIdx = searchLineToDisplayRow.get(scrollToRow - 1);
      if (displayIdx !== undefined) return displayIdx + 1;
      // scrollToRow points to a collapsed row or separator — treat as scroll-to-end
      return displayRows.length;
    }
    return scrollToRow;
  }, [isSectioned, scrollToRow, searchLineToDisplayRow, displayRows.length]);

  // Auto-expand a collapsed section when a search result lands inside it.
  //
  // Guard: only act when scrollToRow itself changes (new search navigation).
  // Without this guard, when new log data arrives the index maps rebuild and
  // re-trigger this effect even though scrollToRow hasn't changed — which would
  // re-open a section the user just manually collapsed.
  const expandedSectionsRef = React.useRef(expandedSections);
  expandedSectionsRef.current = expandedSections;
  const autoExpandedForRowRef = React.useRef<number | undefined>();
  React.useEffect(() => {
    if (!isSectioned || !scrollToRow || scrollToRow <= 0) return;
    if (!currentSearchMatch || currentSearchMatch.rowIndex < 0) return;
    // Skip if we already handled this exact search position
    if (scrollToRow === autoExpandedForRowRef.current) return;
    autoExpandedForRowRef.current = scrollToRow;
    const searchLine = scrollToRow - 1;
    const sectionIndex = searchLineToSection.get(searchLine);
    if (sectionIndex !== undefined && !expandedSectionsRef.current.has(sectionIndex)) {
      toggleSection(sectionIndex);
    }
  }, [isSectioned, scrollToRow, currentSearchMatch, searchLineToSection, toggleSection]);

  useVirtualizedScroll({ virtualizer, scrollToRow: effectiveScrollToRow, onScroll });

  // ── Line number + URL navigation ──────────────────────────────────────────
  const { highlightedLines, handleLineClick, isLineHighlighted } = useLineNumberNavigation();

  React.useEffect(() => {
    if (!highlightedLines || highlightedLines.start <= 0 || rowCount === 0) return;

    let targetIndex: number;
    if (isSectioned) {
      const found = lineNumberToDisplayRow.get(highlightedLines.start);
      if (found === undefined) return;
      targetIndex = found;
    } else {
      const raw = highlightedLines.start - 1;
      targetIndex = raw < rowCount ? raw : rowCount - 1;
    }

    let isMounted = true;
    let rafId2: number | undefined;
    if (typeof window === 'undefined' || !window.requestAnimationFrame) return;
    const rafId1 = requestAnimationFrame(() => {
      if (!isMounted) return;
      rafId2 = requestAnimationFrame(() => {
        if (!isMounted) return;
        virtualizer.scrollToIndex(targetIndex, { align: 'center', behavior: 'auto' });
      });
    });
    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId1);
      if (rafId2 !== undefined) cancelAnimationFrame(rafId2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedLines, rowCount]);

  useKeyboardNavigation({ virtualizer, scrollElementRef: parentRef, enabled: true });

  // ── Sticky-header logic (sections mode) ───────────────────────────────────
  //
  // We collect the actual pixel start of every section-header row from the
  // virtualizer's getVirtualItems() (which includes overscan items above the
  // viewport) and persist it in a ref so it survives after the header scrolls
  // out of the virtual window.  When the layout changes (fold/unfold) we clear
  // the cache because all positions shift.
  const measuredHeaderStarts = React.useRef<Map<number, number>>(new Map());
  const prevDisplayRowsRef = React.useRef(displayRows);
  if (prevDisplayRowsRef.current !== displayRows) {
    prevDisplayRowsRef.current = displayRows;
    measuredHeaderStarts.current.clear();
  }

  const scrollTop = virtualizer.scrollOffset ?? 0;

  // Pre-compute section-header display-row indices for sticky maths
  const sectionHeaderRowIndices = React.useMemo(
    () =>
      displayRows.reduce<number[]>((acc, row, i) => {
        if (row.kind === 'section-header') acc.push(i);
        return acc;
      }, []),
    [displayRows],
  );

  const virtualItems = virtualizer.getVirtualItems();

  // Update the persistent position map from the currently rendered window + overscan
  for (const vItem of virtualItems) {
    if (displayRows[vItem.index]?.kind === 'section-header') {
      measuredHeaderStarts.current.set(vItem.index, vItem.start);
    }
  }

  const { stickyRow, pushUpOffset } = React.useMemo(() => {
    if (!isSectioned || scrollTop <= 0 || sectionHeaderRowIndices.length === 0) {
      return { stickyRow: null, pushUpOffset: 0 };
    }

    const headerTop = (idx: number) => measuredHeaderStarts.current.get(idx) ?? idx * itemSize;

    let currentBucket = -1;
    for (let j = 0; j < sectionHeaderRowIndices.length; j++) {
      if (headerTop(sectionHeaderRowIndices[j]) < scrollTop) {
        currentBucket = j;
      } else {
        break;
      }
    }
    if (currentBucket === -1) return { stickyRow: null, pushUpOffset: 0 };

    const current = displayRows[sectionHeaderRowIndices[currentBucket]] as SectionHeaderRow;
    let pushUp = 0;
    if (currentBucket + 1 < sectionHeaderRowIndices.length) {
      const nextTop = headerTop(sectionHeaderRowIndices[currentBucket + 1]);
      pushUp = Math.min(0, nextTop - scrollTop - itemSize);
    }
    return { stickyRow: current, pushUpOffset: pushUp };
  }, [isSectioned, scrollTop, sectionHeaderRowIndices, displayRows, itemSize]);

  const totalSize = virtualizer.getTotalSize();

  // ── Rendering ─────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative' }}>
      {/* Hidden element to measure actual line height */}
      <div
        ref={measureCallbackRef}
        className="pf-v5-c-log-viewer__list-item"
        style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
      >
        <span className="pf-v5-c-log-viewer__text">M</span>
      </div>

      {/* Sticky section-header overlay (sections mode only) */}
      {stickyRow && (
        <div
          className="log-content__sticky-header"
          style={{ transform: `translateY(${pushUpOffset}px)` }}
          aria-hidden="true"
        >
          <SectionHeader row={stickyRow} onToggle={() => toggleSection(stickyRow.sectionIndex)} />
        </div>
      )}

      {/* Scrollable container with gutter */}
      <div
        ref={parentRef}
        className="log-content__list log-content__with-gutter"
        tabIndex={0}
        style={{
          height: `${height}px`,
          width: typeof width === 'number' ? `${width}px` : width,
          overflow: 'auto',
        }}
        onClick={() => parentRef.current?.focus()}
      >
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
            display: 'flex',
          }}
        >
          {/* Line number gutter */}
          <LineNumberGutter
            virtualItems={virtualItems}
            itemSize={itemSize}
            getLineNumber={
              isSectioned
                ? (idx) => {
                    const row = displayRows[idx];
                    return row?.kind === 'content' ? row.globalLineNumber : null;
                  }
                : undefined
            }
            onLineClick={handleLineClick}
            isLineHighlighted={isLineHighlighted}
          />

          {/* Log content */}
          <div className="log-content__content-column">
            {virtualItems.map((virtualItem) => {
              const baseStyle: React.CSSProperties = {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              };

              if (isSectioned) {
                const row = displayRows[virtualItem.index];
                if (!row) return null;

                if (row.kind === 'section-header') {
                  return (
                    <div
                      key={virtualItem.key}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      className="pf-v5-c-log-viewer__list-item log-content__section-header-row"
                      style={baseStyle}
                    >
                      <SectionHeader row={row} onToggle={() => toggleSection(row.sectionIndex)} />
                    </div>
                  );
                }

                if (row.kind === 'fold-indicator') {
                  return (
                    <div
                      key={virtualItem.key}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      className="pf-v5-c-log-viewer__list-item"
                      style={baseStyle}
                    >
                      <FoldIndicator lineCount={row.lineCount} />
                    </div>
                  );
                }

                // Content row
                const isHighlighted = isLineHighlighted(row.globalLineNumber);
                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    className={`pf-v5-c-log-viewer__list-item${isHighlighted ? ' log-content__line--highlighted' : ''}`}
                    style={baseStyle}
                  >
                    {renderLine(row.flatLineIndex)}
                  </div>
                );
              }

              // Plain mode
              const lineNumber = virtualItem.index + 1;
              const isHighlighted = isLineHighlighted(lineNumber);
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className={`pf-v5-c-log-viewer__list-item${isHighlighted ? ' log-content__line--highlighted' : ''}`}
                  style={baseStyle}
                >
                  {renderLine(virtualItem.index)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
