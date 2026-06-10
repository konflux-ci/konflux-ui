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
