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
import { useScrollTop } from './useScrollTop';
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
  } = useSectionRows(effectiveNormalizedSections, expandedSections);

  const rowCount = displayRows.length;

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
    const sectionIndex = searchLineToSectionIndex.get(expandSearchTargetRow - 1);
    if (sectionIndex === undefined) return;
    expandSection(sectionIndex);
  }, [isMultiSection, expandSearchTargetRow, searchLineToSectionIndex, expandSection]);

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

  const scrollTop = useScrollTop(scrollRef, isMultiSection);

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

  useVirtualizedScroll({ virtualizer, scrollToRow: effectiveScrollToRow, onScroll });

  const { highlightedLines, handleLineClick, isLineHighlighted } = useLineNumberNavigation();

  const highlightScrollTargetIndex = React.useMemo((): number | null => {
    if (!highlightedLines || rowCount === 0) return null;
    const displayIdx = lineNumberToDisplayRow.get(highlightedLines.start);
    return displayIdx ?? null;
  }, [highlightedLines, rowCount, lineNumberToDisplayRow]);

  React.useEffect(() => {
    if (highlightScrollTargetIndex === null) return;

    let isMounted = true;
    let rafId2: number | undefined;
    if (typeof window === 'undefined' || !window.requestAnimationFrame) return;
    const rafId1 = requestAnimationFrame(() => {
      if (!isMounted) return;
      rafId2 = requestAnimationFrame(() => {
        if (!isMounted) return;
        virtualizer.scrollToIndex(highlightScrollTargetIndex, { align: 'center', behavior: 'auto' });
      });
    });
    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId1);
      if (rafId2 !== undefined) cancelAnimationFrame(rafId2);
    };
  }, [highlightScrollTargetIndex, virtualizer]);

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

      {stickyRow && (
        <StickySectionHeaderBar
          row={stickyRow}
          pushUpOffset={pushUpOffset}
          itemSize={itemSize}
          onToggle={() => toggleSection(stickyRow.sectionIndex)}
        />
      )}

      <div
        ref={scrollContainerRef}
        className="log-content__list log-content__with-gutter"
        tabIndex={0}
        style={{
          height: `${height}px`,
          width: typeof width === 'number' ? `${width}px` : width,
          overflow: 'auto',
        }}
        onClick={() => scrollRef.current?.focus()}
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
    </div>
  );
};
