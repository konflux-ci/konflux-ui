import React from 'react';
import { Text } from '@patternfly/react-core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { normalizeSection } from './log-viewer-utils';
import { SectionedVirtualRow } from './SectionedVirtualRow';
import { StickySectionHeaderBar } from './SectionLogUI';
import { computeStickySectionHeader } from './sticky-section-header';
import type { LogSection, NormalizedLogSection, SearchedWord } from './types';
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
  sections: LogSection[];
  /** Pre-normalized sections. When provided by the parent, internal normalization is skipped. */
  normalizedSections?: NormalizedLogSection[];
  height: number;
  width: string | number;
  scrollToRow?: number;
  /** Set when user navigates search matches (prev/next); expands folded step for that match only */
  expandSearchTargetRow?: number;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
  searchText?: string;
  currentSearchMatch?: SearchedWord;
  /**
   * When false, URL hash line navigation (`#L123`) is deferred until logs are fully fetched,
   * so we don't highlight/scroll to a line before the log content has stabilized. Defaults to
   * true.
   */
  readyToNavigate?: boolean;
}

export const VirtualizedLogContent: React.FC<VirtualizedLogContentProps> = ({
  sections,
  normalizedSections: normalizedSectionsProp,
  height,
  width,
  scrollToRow,
  expandSearchTargetRow,
  onScroll,
  searchText = '',
  currentSearchMatch,
  readyToNavigate = true,
}) => {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [itemSize, setItemSize] = React.useState(VIRTUALIZATION_CONFIG.FALLBACK_LINE_HEIGHT);
  const charsPerLineRef = React.useRef(VIRTUALIZATION_CONFIG.FALLBACK_CHARS_PER_LINE);

  const isMultiSection = sections.length > 1;
  const { expandedSections, toggleSection, expandSection } = useSectionFold(sections);

  const internalNormalizedSections = React.useMemo(
    () => (normalizedSectionsProp ? null : sections.map(normalizeSection)),
    [normalizedSectionsProp, sections],
  );
  const effectiveNormalizedSections = normalizedSectionsProp ?? internalNormalizedSections ?? [];

  const {
    displayRows,
    allLines,
    searchLineToDisplayRow,
    searchLineToFlatLineIndex,
    searchLineToSectionIndex,
    lineNumberToDisplayRow,
    lineNumberToSectionIndex,
  } = useSectionRows(effectiveNormalizedSections, expandedSections);

  const rowCount = displayRows.length;

  // Keep a ref so the expand-on-search effect always reads the latest map
  // without listing it as a dep (which would re-trigger on every fold/unfold).
  const searchLineToSectionIndexRef = React.useRef(searchLineToSectionIndex);
  searchLineToSectionIndexRef.current = searchLineToSectionIndex;

  const lineNumberToSectionIndexRef = React.useRef(lineNumberToSectionIndex);
  lineNumberToSectionIndexRef.current = lineNumberToSectionIndex;

  useResizeObserverFix();

  const deferredSearchText = React.useDeferredValue(searchText);
  const searchRegex = useSearchRegex(deferredSearchText);
  const { tokenizeLine } = useTokenization(allLines);

  const contentSearchMatch = React.useMemo((): SearchedWord | undefined => {
    if (!currentSearchMatch || currentSearchMatch.rowIndex < 0) return undefined;
    const flatLineIndex = searchLineToFlatLineIndex.get(currentSearchMatch.rowIndex);
    if (flatLineIndex === undefined) return undefined;
    return { rowIndex: flatLineIndex, matchIndex: currentSearchMatch.matchIndex };
  }, [currentSearchMatch, searchLineToFlatLineIndex]);

  const renderLine = useLineRenderer({ tokenizeLine, searchRegex, currentSearchMatch: contentSearchMatch });

  React.useEffect(() => {
    if (!isMultiSection || !expandSearchTargetRow || expandSearchTargetRow <= 0) return;
    const sectionIndex = searchLineToSectionIndexRef.current.get(expandSearchTargetRow - 1);
    if (sectionIndex === undefined) return;
    expandSection(sectionIndex);
  }, [isMultiSection, expandSearchTargetRow, expandSection]);

  const measureCallbackRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const measured = node.offsetHeight;
      if (measured > 0) setItemSize(measured);
    }
  }, []);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const rafId = requestAnimationFrame(() => {
      const style = getComputedStyle(container);
      const font = style.font || `${style.fontSize} ${style.fontFamily}`;
      charsPerLineRef.current = calculateCharsPerLine(container, measureAverageCharWidth(font));
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  const estimateRowHeight = React.useCallback(
    (index: number): number => {
      if (itemSize === 0) return VIRTUALIZATION_CONFIG.FALLBACK_LINE_HEIGHT;

      const row = displayRows[index];
      if (!row || row.kind !== 'content') return itemSize;
      const text = allLines[row.flatLineIndex] || '';
      const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLineRef.current));
      return Math.ceil(itemSize * estimatedLines * getSafetyMargin(rowCount));
    },
    [displayRows, allLines, itemSize, rowCount],
  );

  const virtualizer = useVirtualizer<HTMLDivElement, Element>({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: estimateRowHeight,
    overscan: getOverscanCount(rowCount),
    useFlushSync: false,
  });

  const effectiveScrollToRow = React.useMemo(() => {
    if (!scrollToRow || scrollToRow <= 0) return undefined;
    const displayIdx = searchLineToDisplayRow.get(scrollToRow - 1);
    return displayIdx !== undefined ? displayIdx + 1 : undefined;
  }, [scrollToRow, searchLineToDisplayRow]);

  const { clearScrollTracking } = useVirtualizedScroll({
    virtualizer,
    scrollToRow: effectiveScrollToRow,
    onScroll,
  });

  const { highlightedLines, handleLineClick, isLineHighlighted } = useLineNumberNavigation({
    readyToNavigate,
  });

  React.useEffect(() => {
    if (!isMultiSection || !highlightedLines) return;

    const sectionsToExpand = new Set<number>();
    for (let line = highlightedLines.start; line <= highlightedLines.end; line++) {
      const sectionIndex = lineNumberToSectionIndexRef.current.get(line);
      if (sectionIndex !== undefined) sectionsToExpand.add(sectionIndex);
    }
    sectionsToExpand.forEach((sectionIndex) => expandSection(sectionIndex));
  }, [isMultiSection, highlightedLines, expandSection]);

  const highlightScrollTargetIndex = React.useMemo((): number | null => {
    if (!highlightedLines || rowCount === 0) return null;
    const displayIdx = lineNumberToDisplayRow.get(highlightedLines.start);
    // Exact line found — scroll to it; if the requested line is beyond the available
    // log (e.g. stale URL hash or log still streaming), fall back to the last row.
    return displayIdx ?? rowCount - 1;
  }, [highlightedLines, rowCount, lineNumberToDisplayRow]);

  const lastScrolledHighlightRef = React.useRef<{
    start: number;
    end: number;
    targetIndex: number;
  } | null>(null);

  React.useEffect(() => {
    if (!highlightedLines || highlightScrollTargetIndex === null) return;

    const displayIdx = lineNumberToDisplayRow.get(highlightedLines.start);
    const targetIndex = displayIdx ?? highlightScrollTargetIndex;
    const prev = lastScrolledHighlightRef.current;

    const isNewHighlight =
      prev?.start !== highlightedLines.start || prev?.end !== highlightedLines.end;
    const targetImproved =
      !isNewHighlight &&
      displayIdx !== undefined &&
      prev?.targetIndex !== targetIndex &&
      lineNumberToDisplayRow.has(highlightedLines.start);

    const sectionIndex = lineNumberToSectionIndexRef.current.get(highlightedLines.start);
    const awaitingExpand =
      isMultiSection &&
      displayIdx === undefined &&
      sectionIndex !== undefined &&
      !expandedSections.has(sectionIndex);

    if (awaitingExpand) return;
    if (!isNewHighlight && !targetImproved) return;

    lastScrolledHighlightRef.current = {
      start: highlightedLines.start,
      end: highlightedLines.end,
      targetIndex,
    };

    clearScrollTracking();

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
  }, [
    highlightedLines,
    highlightScrollTargetIndex,
    lineNumberToDisplayRow,
    virtualizer,
    clearScrollTracking,
    isMultiSection,
    expandedSections,
  ]);

  const navRef = useKeyboardNavigation({
    scrollElementRef: scrollRef,
    lineHeight: itemSize,
    enabled: true,
  });

  const scrollContainerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      if (navRef && 'current' in navRef) {
        (navRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [navRef],
  );

  const virtualItems = virtualizer.getVirtualItems();
  const scrollTop = isMultiSection ? (virtualizer.scrollOffset ?? 0) : 0;
  const { stickyRow, pushUpOffset } = computeStickySectionHeader({
    enabled: isMultiSection,
    scrollTop,
    displayRows,
    virtualItems,
    itemSize,
  });

  return (
    <div className="log-content__container">
      <div
        ref={measureCallbackRef}
        className="pf-v5-c-log-viewer__list-item"
        style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
      >
        <Text component="small" className="pf-v5-c-log-viewer__text">
          M
        </Text>
      </div>

      <div
        ref={scrollContainerRef}
        className="log-content__list log-content__with-gutter"
        tabIndex={0}
        style={{
          height: `${height}px`,
          width: typeof width === 'number' ? `${width}px` : width,
          overflow: 'auto',
        }}
        onClick={() => scrollRef.current?.focus({ preventScroll: true })}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const row = displayRows[virtualItem.index];
            if (!row) return null;
            return (
              <SectionedVirtualRow
                key={virtualItem.key}
                virtualIndex={virtualItem.index}
                start={virtualItem.start}
                row={row}
                measureElement={virtualizer.measureElement}
                isLineHighlighted={isLineHighlighted}
                onToggleSection={toggleSection}
                renderLogLine={renderLine}
                onLineClick={handleLineClick}
              />
            );
          })}
        </div>
      </div>

      {stickyRow && (
        <StickySectionHeaderBar
          row={stickyRow}
          pushUpOffset={pushUpOffset}
          itemSize={itemSize}
          onToggle={() => toggleSection(stickyRow.sectionIndex)}
          onLineClick={handleLineClick}
        />
      )}
    </div>
  );
};
