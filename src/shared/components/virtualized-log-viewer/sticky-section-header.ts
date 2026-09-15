import type { VirtualItem } from '@tanstack/react-virtual';
import type { LogDisplayRow, SectionHeaderRow } from './types';

const isSectionHeaderRow = (row: LogDisplayRow | undefined): row is SectionHeaderRow =>
  row?.kind === 'section-header';

export function computeStickySectionHeader(options: {
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
    if (isSectionHeaderRow(displayRows[i])) sectionHeaderRowIndices.push(i);
  }
  if (sectionHeaderRowIndices.length === 0) {
    return { stickyRow: null, pushUpOffset: 0 };
  }

  const headerTopByIndex = new Map<number, number>();
  for (const vItem of virtualItems) {
    if (isSectionHeaderRow(displayRows[vItem.index])) {
      headerTopByIndex.set(vItem.index, vItem.start);
    }
  }

  const headerTop = (idx: number): number => {
    const exact = headerTopByIndex.get(idx);
    if (exact !== undefined) return exact;

    // When a section header is off-screen, extrapolate from the nearest
    // visible virtual item instead of using `idx * itemSize`. The visible
    // items have accurate `start` positions that account for variable
    // row heights (e.g. wrapped log lines), avoiding a premature header
    // switch in large sections with wrapped content.
    if (virtualItems.length > 0) {
      const first = virtualItems[0];
      const last = virtualItems[virtualItems.length - 1];
      if (idx <= first.index) {
        return first.start - (first.index - idx) * itemSize;
      }
      return last.start + (idx - last.index) * itemSize;
    }

    return idx * itemSize;
  };

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
