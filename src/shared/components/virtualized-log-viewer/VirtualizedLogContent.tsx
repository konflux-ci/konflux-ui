import React from 'react';
import { Button, Flex, FlexItem, Text } from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { LineNumberGutter } from './LineNumberGutter';
import type { LogDisplayRow, LogSection, SectionHeaderRow, SearchedWord } from './types';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { useLineNumberNavigation } from './useLineNumberNavigation';
import { useLineRenderer } from './useLineRenderer';
import { useResizeObserverFix } from './useResizeObserverFix';
import { useSearchRegex } from './useSearchRegex';
import { useSectionFold, useSectionRows } from './useSectionLog';
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

const virtualRowStyle = (start: number): React.CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  transform: `translateY(${start}px)`,
});

const SectionHeaderButton: React.FC<{ row: SectionHeaderRow; onToggle: () => void }> = ({
  row,
  onToggle,
}) => (
  <Button
    variant="plain"
    className="pf-v5-u-p-0"
    style={{ pointerEvents: 'auto' }}
    onClick={onToggle}
    aria-expanded={row.isExpanded}
    data-test={`fold-header-${row.sectionName}`}
  >
    <Flex
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentFlexStart' }}
      spaceItems={{ default: 'spaceItemsXs' }}
      flexWrap={{ default: 'nowrap' }}
      gap={{ default: 'gapNone' }}
    >
      <FlexItem>
        {row.isExpanded ? <AngleDownIcon aria-hidden /> : <AngleRightIcon aria-hidden />}
      </FlexItem>
      <FlexItem className="pf-v5-c-log-viewer__text pf-v5-u-font-weight-bold">
        {row.sectionName.toUpperCase()}
      </FlexItem>
    </Flex>
  </Button>
);

const FoldIndicatorLine: React.FC<{ lineCount: number }> = ({ lineCount }) => (
  <Text component="small" className="pf-v5-c-log-viewer__text">
    ··· {lineCount} lines hidden
  </Text>
);

const StickySectionHeaderBar: React.FC<{
  row: SectionHeaderRow;
  pushUpOffset: number;
  itemSize: number;
  onToggle: () => void;
}> = ({ row, pushUpOffset, itemSize, onToggle }) => (
  <Flex
    alignItems={{ default: 'alignItemsStretch' }}
    gap={{ default: 'gapNone' }}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      pointerEvents: 'none',
      transform: `translateY(${pushUpOffset}px)`,
      height: `${itemSize}px`,
      background:
        'var(--pf-v5-c-log-viewer__main--BackgroundColor, var(--pf-v5-global--BackgroundColor--200))',
      boxShadow: 'var(--pf-v5-global--BoxShadow--sm)',
    }}
    data-test={`sticky-header-${row.sectionName}`}
  >
    <Flex
      className="line-number__gutter"
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentFlexEnd' }}
      gap={{ default: 'gapNone' }}
      style={{ position: 'relative', height: `${itemSize}px` }}
    >
      <FlexItem className="line-number__line-number pf-v5-u-pr-sm">{row.lineNumber}</FlexItem>
    </Flex>
    <Flex
      className="log-content__content-column pf-v5-c-log-viewer__list-item"
      flex={{ default: 'flex_1' }}
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentFlexStart' }}
      gap={{ default: 'gapNone' }}
      style={{ minWidth: 0, height: `${itemSize}px` }}
    >
      <FlexItem>
        <SectionHeaderButton row={row} onToggle={onToggle} />
      </FlexItem>
    </Flex>
  </Flex>
);

type SectionedVirtualRowProps = {
  virtualIndex: number;
  start: number;
  row: LogDisplayRow;
  measureElement: Virtualizer<HTMLDivElement, Element>['measureElement'];
  isLineHighlighted: (lineNumber: number) => boolean;
  onToggleSection: (sectionIndex: number) => void;
  renderLogLine: (flatLineIndex: number) => React.ReactNode;
};

const SectionedVirtualRow: React.FC<SectionedVirtualRowProps> = ({
  virtualIndex,
  start,
  row,
  measureElement,
  isLineHighlighted,
  onToggleSection,
  renderLogLine,
}) => {
  const rowClassName = `pf-v5-c-log-viewer__list-item${
    row.kind === 'content' && isLineHighlighted(row.globalLineNumber)
      ? ' log-content__line--highlighted'
      : ''
  }`;

  const rowProps = {
    'data-index': virtualIndex,
    ref: measureElement,
    className: rowClassName,
    style: virtualRowStyle(start),
  };

  if (row.kind === 'section-header') {
    return (
      <div {...rowProps}>
        <SectionHeaderButton row={row} onToggle={() => onToggleSection(row.sectionIndex)} />
      </div>
    );
  }

  if (row.kind === 'fold-indicator') {
    return (
      <div {...rowProps}>
        <FoldIndicatorLine lineCount={row.lineCount} />
      </div>
    );
  }

  return <div {...rowProps}>{renderLogLine(row.flatLineIndex)}</div>;
};

const isSectionHeaderRow = (row: LogDisplayRow | undefined): row is SectionHeaderRow =>
  row?.kind === 'section-header';

/** Tracks scroll offset for sticky headers. Must run before virtualizer.getVirtualItems(). */
function useScrollTop(
  scrollElementRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
): number {
  const [scrollTop, setScrollTop] = React.useState(0);

  React.useEffect(() => {
    const el = scrollElementRef.current;
    if (!el || !enabled) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [enabled, scrollElementRef]);

  return scrollTop;
}

function computeStickySectionHeader(options: {
  enabled: boolean;
  scrollTop: number;
  displayRows: LogDisplayRow[];
  virtualItems: VirtualItem[];
  itemSize: number;
}): { stickyRow: SectionHeaderRow | null; pushUpOffset: number } {
  const { enabled, scrollTop, displayRows, virtualItems, itemSize } = options;

  if (!enabled || scrollTop <= 0) {
    return { stickyRow: null, pushUpOffset: 0 };
  }

  const sectionHeaderRowIndices: number[] = [];
  for (let i = 0; i < displayRows.length; i++) {
    if (displayRows[i].kind === 'section-header') sectionHeaderRowIndices.push(i);
  }
  if (sectionHeaderRowIndices.length === 0) {
    return { stickyRow: null, pushUpOffset: 0 };
  }

  const headerTopByIndex = new Map<number, number>();
  for (const vItem of virtualItems) {
    if (displayRows[vItem.index]?.kind === 'section-header') {
      headerTopByIndex.set(vItem.index, vItem.start);
    }
  }

  const headerTop = (idx: number) => headerTopByIndex.get(idx) ?? idx * itemSize;

  let currentBucket = -1;
  for (let j = 0; j < sectionHeaderRowIndices.length; j++) {
    if (headerTop(sectionHeaderRowIndices[j]) < scrollTop) {
      currentBucket = j;
    } else {
      break;
    }
  }
  if (currentBucket === -1) return { stickyRow: null, pushUpOffset: 0 };

  const candidate = displayRows[sectionHeaderRowIndices[currentBucket]];
  if (!isSectionHeaderRow(candidate)) return { stickyRow: null, pushUpOffset: 0 };

  let pushUpOffset = 0;
  if (currentBucket + 1 < sectionHeaderRowIndices.length) {
    const nextTop = headerTop(sectionHeaderRowIndices[currentBucket + 1]);
    pushUpOffset = Math.min(0, nextTop - scrollTop - itemSize);
  }
  return { stickyRow: candidate, pushUpOffset };
}

export const VirtualizedLogContent: React.FC<VirtualizedLogContentProps> = ({
  sections,
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

  const showSectionLayout = sections.length >= 1;
  const isMultiSection = sections.length > 1;
  const { expandedSections, toggleSection, expandSection } = useSectionFold(sections);
  const layoutExpanded = expandedSections;
  const {
    displayRows,
    allLines,
    searchLineToDisplayRow,
    searchLineToFlatLineIndex,
    searchLineToSectionIndex,
    lineNumberToDisplayRow,
  } = useSectionRows(sections, layoutExpanded);

  const lines = showSectionLayout ? allLines : [];
  const rowCount = showSectionLayout ? displayRows.length : 0;

  useResizeObserverFix();

  const deferredSearchText = React.useDeferredValue(searchText);
  const searchRegex = useSearchRegex(deferredSearchText);
  const { tokenizeLine } = useTokenization(lines);

  const contentSearchMatch = React.useMemo((): SearchedWord | undefined => {
    if (!currentSearchMatch || currentSearchMatch.rowIndex < 0) return undefined;
    if (!showSectionLayout) return currentSearchMatch;
    const flatLineIndex = searchLineToFlatLineIndex.get(currentSearchMatch.rowIndex);
    if (flatLineIndex === undefined) return undefined;
    return { rowIndex: flatLineIndex, matchIndex: currentSearchMatch.matchIndex };
  }, [currentSearchMatch, showSectionLayout, searchLineToFlatLineIndex]);

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

      if (showSectionLayout) {
        const row = displayRows[index];
        if (!row || row.kind !== 'content') return itemSize;
        const text = allLines[row.flatLineIndex] || '';
        const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLineRef.current));
        return Math.ceil(itemSize * estimatedLines * getSafetyMargin(rowCount));
      }

      return itemSize;
    },
    [showSectionLayout, displayRows, allLines, itemSize, rowCount],
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
    if (!showSectionLayout) return scrollToRow;
    const displayIdx = searchLineToDisplayRow.get(scrollToRow - 1);
    return displayIdx !== undefined ? displayIdx + 1 : undefined;
  }, [showSectionLayout, scrollToRow, searchLineToDisplayRow]);

  useVirtualizedScroll({ virtualizer, scrollToRow: effectiveScrollToRow, onScroll });

  const { highlightedLines, handleLineClick, isLineHighlighted } = useLineNumberNavigation();

  React.useEffect(() => {
    if (!highlightedLines || rowCount === 0) return;

    let targetIndex: number | undefined;
    if (showSectionLayout) {
      targetIndex = lineNumberToDisplayRow.get(highlightedLines.start);
      if (targetIndex === undefined) return;
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

  const getGutterLineNumber = (virtualItemIndex: number): number | null => {
    if (!showSectionLayout) return virtualItemIndex + 1;
    const row = displayRows[virtualItemIndex];
    if (row?.kind === 'section-header') return row.lineNumber;
    if (row?.kind === 'content') return row.globalLineNumber;
    return null;
  };

  return (
    <Flex style={{ position: 'relative' }}>
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
        <Flex
          alignItems={{ default: 'alignItemsStretch' }}
          gap={{ default: 'gapNone' }}
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <LineNumberGutter
            virtualItems={virtualItems}
            itemSize={itemSize}
            getLineNumber={showSectionLayout ? getGutterLineNumber : undefined}
            onLineClick={handleLineClick}
            isLineHighlighted={isLineHighlighted}
          />

          <Flex className="log-content__content-column" flex={{ default: 'flex_1' }} gap={{ default: 'gapNone' }}>
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
                />
              );
            })}
          </Flex>
        </Flex>
      </div>
    </Flex>
  );
};
