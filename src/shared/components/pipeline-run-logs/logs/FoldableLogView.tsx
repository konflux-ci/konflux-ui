import React from 'react';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons';
import { LogViewerContext, LogViewerToolbarContext } from '@patternfly/react-log-viewer';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLineRenderer } from '~/shared/components/virtualized-log-viewer/useLineRenderer';
import { useSearchRegex } from '~/shared/components/virtualized-log-viewer/useSearchRegex';
import { useTokenization } from '~/shared/components/virtualized-log-viewer/useTokenization';
import { useVirtualizedScroll } from '~/shared/components/virtualized-log-viewer/useVirtualizedScroll';
import type { LogSection } from './LogViewer';

import './FoldableLogView.scss';

// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_REGEX = /\u001b\[[0-9;]*m/g;

// Height used for estimateSize AND for push-up math.
// All rows are designed to be exactly this tall.
const ROW_HEIGHT = 20;

// ─── Row types ───────────────────────────────────────────────────────────────

type SectionHeaderRow = {
  kind: 'section-header';
  sectionName: string;
  sectionIndex: number;
  lineNumber: number;
  lineCount: number;
  isExpanded: boolean;
};

type ContentRow = {
  kind: 'content';
  globalLineNumber: number;
  flatLineIndex: number; // index into the flat allLines array for Prism tokenization
  text: string;
  sectionIndex: number;
};

type FoldIndicatorRow = {
  kind: 'fold-indicator';
  sectionIndex: number;
  lineCount: number;
};

type DisplayRow = SectionHeaderRow | ContentRow | FoldIndicatorRow;

// ─── Gutter sub-columns ───────────────────────────────────────────────────────
//
// Every row has two gutter sub-columns so the log text always starts at the
// same horizontal position:
//
//   [ number col (--ln-width) ][ icon col (16 px) ] text …

const NumberCol: React.FC<{ n?: number }> = ({ n }) => (
  <span className="foldable-log__gutter-number">{n ?? ''}</span>
);

const IconCol: React.FC<{ icon?: React.ReactNode }> = ({ icon }) => (
  <span className="foldable-log__gutter-icon">{icon}</span>
);

// ─── Row renderers ────────────────────────────────────────────────────────────

const SectionHeaderRowRenderer: React.FC<{
  row: SectionHeaderRow;
  onToggle: () => void;
}> = ({ row, onToggle }) => (
  <button
    className="foldable-log__section-header"
    onClick={onToggle}
    aria-expanded={row.isExpanded}
    data-test={`fold-header-${row.sectionName}`}
  >
    <NumberCol n={row.lineNumber} />
    <IconCol icon={row.isExpanded ? <AngleDownIcon /> : <AngleRightIcon />} />
    <span className="foldable-log__section-name">
      {row.sectionName}
      {!row.isExpanded && (
        <span className="foldable-log__section-line-count">({row.lineCount} lines)</span>
      )}
    </span>
  </button>
);

const ContentRowRenderer: React.FC<{
  row: ContentRow;
  renderLine: (flatIndex: number) => React.ReactNode;
}> = ({ row, renderLine }) => (
  <div className="foldable-log__content-row">
    <NumberCol n={row.globalLineNumber} />
    <IconCol />
    <span className="foldable-log__line-text">{renderLine(row.flatLineIndex)}</span>
  </div>
);

const FoldIndicatorRowRenderer: React.FC<{ row: FoldIndicatorRow }> = ({ row }) => (
  <div className="foldable-log__fold-indicator">
    <NumberCol />
    <IconCol />
    <span className="foldable-log__fold-indicator-text">··· {row.lineCount} lines hidden</span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface FoldableLogViewProps {
  readonly logSections: readonly LogSection[];
  readonly height: number;
  readonly scrollToRow?: number;
  readonly onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
}

export const FoldableLogView: React.FC<FoldableLogViewProps> = ({
  logSections,
  height,
  scrollToRow,
  onScroll,
}) => {
  // Search context — read once at the top for use by the line renderer
  const logViewerContext = React.useContext(LogViewerContext);
  const toolbarContext = React.useContext(LogViewerToolbarContext);
  const searchedInput = logViewerContext?.searchedInput ?? '';
  const rowInFocus = toolbarContext?.rowInFocus;
  const searchRegex = useSearchRegex(searchedInput);

  // All sections expanded by default
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(
    () => new Set(logSections.map((_, i) => i)),
  );

  // Auto-expand newly arriving sections
  const prevCountRef = React.useRef(logSections.length);
  React.useEffect(() => {
    if (logSections.length > prevCountRef.current) {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        for (let i = prevCountRef.current; i < logSections.length; i++) {
          next.add(i);
        }
        return next;
      });
    }
    prevCountRef.current = logSections.length;
  }, [logSections.length]);

  const toggleSection = React.useCallback((sectionIndex: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) next.delete(sectionIndex);
      else next.add(sectionIndex);
      return next;
    });
  }, []);

  // Strip ANSI codes and split into lines once per section
  const processedSections = React.useMemo(
    () =>
      logSections.map((s) =>
        s.data.replace(/\r/g, '\n').replace(ANSI_ESCAPE_REGEX, '').split('\n'),
      ),
    [logSections],
  );

  // Flat array of every log line across all sections — fed to the Prism tokenizer
  const allLines = React.useMemo(() => processedSections.flat(), [processedSections]);

  const totalNumberedRows = React.useMemo(
    () => allLines.length + logSections.length,
    [allLines.length, logSections.length],
  );

  const cssVars = React.useMemo(
    () =>
      ({
        '--ln-width': `${Math.max(String(totalNumberedRows).length * 8 + 8, 28)}px`,
      }) as React.CSSProperties,
    [totalNumberedRows],
  );

  // ── scrollToRow mapping ─────────────────────────────────────────────────────
  //
  // LogViewer passes scrollToRow as a 1-indexed line number in the combined
  // `data` string space (which includes one name line + one separator per
  // section).  We need to map that to a display-row index in this component.
  //
  // Combined data structure (for N sections):
  //   lines[0]           = section 0 name
  //   lines[1..n0]       = section 0 content
  //   lines[n0+1]        = '' (separator, omitted after last section)
  //   lines[n0+2]        = section 1 name
  //   lines[n0+3..n0+n1+2] = section 1 content
  //   ...
  //
  // rowIndexToFlatLineIndex maps a rowIndex (in the combined-string space) to
  // the matching flatLineIndex in allLines (content only, no names/separators).

  const rowIndexToFlatLineIndex = React.useMemo(() => {
    const map = new Map<number, number>();
    let rowIndex = 0;
    let flatLineIndex = 0;
    for (let i = 0; i < logSections.length; i++) {
      rowIndex++; // skip section name line
      for (let j = 0; j < processedSections[i].length; j++) {
        map.set(rowIndex, flatLineIndex);
        rowIndex++;
        flatLineIndex++;
      }
      if (i < logSections.length - 1) {
        rowIndex++; // skip separator between sections
      }
    }
    return map;
  }, [logSections, processedSections]);

  // flatLineIndex → which section owns it (for auto-expand on search navigation)
  const flatIndexToSectionIndex = React.useMemo(() => {
    const map = new Map<number, number>();
    let flatLineIndex = 0;
    for (let i = 0; i < logSections.length; i++) {
      for (let j = 0; j < processedSections[i].length; j++) {
        map.set(flatLineIndex, i);
        flatLineIndex++;
      }
    }
    return map;
  }, [logSections, processedSections]);

  // Build the flat display-row list. Section headers consume one line number.
  // Content rows carry a flatLineIndex into allLines for Prism tokenization.
  const displayRows = React.useMemo<DisplayRow[]>(() => {
    const rows: DisplayRow[] = [];
    let globalLineNumber = 1;
    let flatLineIndex = 0;

    for (let i = 0; i < logSections.length; i++) {
      const lines = processedSections[i];
      const isExpanded = expandedSections.has(i);

      rows.push({
        kind: 'section-header',
        sectionName: logSections[i].name,
        sectionIndex: i,
        lineNumber: globalLineNumber,
        lineCount: lines.length,
        isExpanded,
      });
      globalLineNumber++;

      if (isExpanded) {
        for (const text of lines) {
          rows.push({ kind: 'content', globalLineNumber, flatLineIndex, text, sectionIndex: i });
          globalLineNumber++;
          flatLineIndex++;
        }
      } else {
        rows.push({ kind: 'fold-indicator', sectionIndex: i, lineCount: lines.length });
        globalLineNumber += lines.length;
        flatLineIndex += lines.length;
      }
    }

    return rows;
  }, [logSections, processedSections, expandedSections]);

  // flatLineIndex → display row index (only content rows; section/fold rows excluded)
  const flatIndexToDisplayRowIndex = React.useMemo(() => {
    const map = new Map<number, number>();
    displayRows.forEach((row, i) => {
      if (row.kind === 'content') map.set(row.flatLineIndex, i);
    });
    return map;
  }, [displayRows]);

  // If a search result lands inside a collapsed section, expand it so the row
  // becomes visible before useVirtualizedScroll tries to scroll to it.
  // Use a ref to avoid listing expandedSections in deps (prevents re-trigger loop).
  const expandedSectionsRef = React.useRef(expandedSections);
  expandedSectionsRef.current = expandedSections;
  React.useEffect(() => {
    if (!scrollToRow || scrollToRow <= 0) return;
    const targetFlatLine = rowIndexToFlatLineIndex.get(scrollToRow - 1);
    if (targetFlatLine === undefined) return;
    const sectionIndex = flatIndexToSectionIndex.get(targetFlatLine);
    if (sectionIndex !== undefined && !expandedSectionsRef.current.has(sectionIndex)) {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        next.add(sectionIndex);
        return next;
      });
    }
  }, [scrollToRow, rowIndexToFlatLineIndex, flatIndexToSectionIndex]);

  // Translate scrollToRow (combined-string space, 1-indexed) to a display row
  // index (1-indexed) suitable for useVirtualizedScroll.
  const effectiveScrollToRow = React.useMemo(() => {
    if (!scrollToRow || scrollToRow <= 0) return undefined;
    const targetFlatLine = rowIndexToFlatLineIndex.get(scrollToRow - 1);
    if (targetFlatLine === undefined) {
      // scrollToRow points to a name/separator line or beyond the last line —
      // treat as "scroll to end" (auto-scroll case).
      return displayRows.length;
    }
    const displayRowIndex = flatIndexToDisplayRowIndex.get(targetFlatLine);
    // Return undefined when target is in a collapsed section; the auto-expand
    // effect above will expand it on the next render, which recalculates
    // displayRows and makes flatIndexToDisplayRowIndex available.
    return displayRowIndex !== undefined ? displayRowIndex + 1 : undefined;
  }, [scrollToRow, rowIndexToFlatLineIndex, flatIndexToDisplayRowIndex, displayRows.length]);

  // Prism tokenization + line renderer — same pipeline as VirtualizedLogViewer
  const { tokenizeLine } = useTokenization(allLines);
  const renderLine = useLineRenderer({ tokenizeLine, searchRegex, currentSearchMatch: rowInFocus });

  // Pre-compute the display-row indices that are section headers (for sticky math)
  const sectionHeaderRowIndices = React.useMemo(
    () =>
      displayRows.reduce<number[]>((acc, row, i) => {
        if (row.kind === 'section-header') acc.push(i);
        return acc;
      }, []),
    [displayRows],
  );

  // ── Virtualizer ─────────────────────────────────────────────────────────────

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: displayRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  // Wire scroll-to-row and onScroll using the shared hook (same as VirtualizedLogViewer).
  // This enables the auto-scroll resume button and search result navigation.
  useVirtualizedScroll({ virtualizer, scrollToRow: effectiveScrollToRow, onScroll });

  // ── Sticky-header logic ─────────────────────────────────────────────────────
  //
  // Drive sticky-header position from virtualizer.scrollOffset so we don't
  // need a separate scroll-state and DOM read.

  const scrollTop = virtualizer.scrollOffset ?? 0;

  const { stickyRow, pushUpOffset } = React.useMemo(() => {
    if (scrollTop <= 0 || sectionHeaderRowIndices.length === 0) {
      return { stickyRow: null, pushUpOffset: 0 };
    }

    let currentBucket = -1;
    for (let j = 0; j < sectionHeaderRowIndices.length; j++) {
      const headerTop = sectionHeaderRowIndices[j] * ROW_HEIGHT;
      if (headerTop < scrollTop) {
        currentBucket = j;
      } else {
        break;
      }
    }

    if (currentBucket === -1) return { stickyRow: null, pushUpOffset: 0 };

    const current = displayRows[sectionHeaderRowIndices[currentBucket]] as SectionHeaderRow;

    // Push-up: how far the next header has crept into the sticky zone
    let pushUp = 0;
    if (currentBucket + 1 < sectionHeaderRowIndices.length) {
      const nextTop = sectionHeaderRowIndices[currentBucket + 1] * ROW_HEIGHT;
      const distanceFromViewportTop = nextTop - scrollTop;
      // When next header is within ROW_HEIGHT of the top, start sliding current up
      pushUp = Math.min(0, distanceFromViewportTop - ROW_HEIGHT);
    }

    return { stickyRow: current, pushUpOffset: pushUp };
  }, [scrollTop, sectionHeaderRowIndices, displayRows]);

  const totalSize = virtualizer.getTotalSize();

  return (
    // Outer wrapper: position:relative so the sticky overlay can sit on top
    // overflow:hidden clips the sticky header as it slides up during push-up
    <div className="foldable-log__wrapper" style={{ height, ...cssVars }}>
      {/* ── Sticky header overlay ─────────────────────────────────────────── */}
      {stickyRow && (
        <div
          className="foldable-log__sticky-overlay"
          style={{ transform: `translateY(${pushUpOffset}px)` }}
          aria-hidden="true"
        >
          <SectionHeaderRowRenderer
            row={stickyRow}
            onToggle={() => toggleSection(stickyRow.sectionIndex)}
          />
        </div>
      )}

      {/* ── Scrollable log content ────────────────────────────────────────── */}
      <div ref={scrollRef} className="foldable-log" style={{ height }}>
        <div style={{ height: `${totalSize}px`, width: '100%', position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const row = displayRows[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="foldable-log__row"
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                {row.kind === 'section-header' && (
                  <SectionHeaderRowRenderer
                    row={row}
                    onToggle={() => toggleSection(row.sectionIndex)}
                  />
                )}
                {row.kind === 'content' && <ContentRowRenderer row={row} renderLine={renderLine} />}
                {row.kind === 'fold-indicator' && <FoldIndicatorRowRenderer row={row} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
