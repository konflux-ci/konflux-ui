import type { VirtualItem } from '@tanstack/react-virtual';
import { computeStickySectionHeader } from '../sticky-section-header';
import type { LogDisplayRow, SectionHeaderRow, ContentRow } from '../types';

const makeSectionHeader = (
  sectionIndex: number,
  sectionName: string,
  lineNumber: number,
  lineCount: number,
): SectionHeaderRow => ({
  kind: 'section-header',
  sectionIndex,
  sectionName,
  lineNumber,
  lineCount,
  isExpanded: true,
  isTailed: false,
});

const makeContentRow = (
  flatLineIndex: number,
  globalLineNumber: number,
  sectionIndex: number,
): ContentRow => ({
  kind: 'content',
  flatLineIndex,
  globalLineNumber,
  sectionIndex,
});

const makeVirtualItem = (index: number, start: number): VirtualItem =>
  ({
    index,
    start,
    size: 19,
    end: start + 19,
    key: index,
    lane: 0,
  }) as VirtualItem;

describe('computeStickySectionHeader', () => {
  it('should return null when not enabled', () => {
    const result = computeStickySectionHeader({
      enabled: false,
      scrollTop: 100,
      displayRows: [],
      virtualItems: [],
      itemSize: 19,
    });
    expect(result.stickyRow).toBeNull();
  });

  it('should return null when scrollTop is 0', () => {
    const result = computeStickySectionHeader({
      enabled: true,
      scrollTop: 0,
      displayRows: [makeSectionHeader(0, 'step-build', 1, 10)],
      virtualItems: [],
      itemSize: 19,
    });
    expect(result.stickyRow).toBeNull();
  });

  it('should return null when there are no section headers', () => {
    const displayRows: LogDisplayRow[] = [makeContentRow(0, 1, 0)];
    const result = computeStickySectionHeader({
      enabled: true,
      scrollTop: 100,
      displayRows,
      virtualItems: [makeVirtualItem(0, 0)],
      itemSize: 19,
    });
    expect(result.stickyRow).toBeNull();
  });

  it('should return the first section header when scrolled past it', () => {
    const displayRows: LogDisplayRow[] = [
      makeSectionHeader(0, 'step-build', 1, 5),
      makeContentRow(0, 2, 0),
      makeContentRow(1, 3, 0),
    ];
    const virtualItems = [makeVirtualItem(1, 19), makeVirtualItem(2, 38)];
    const result = computeStickySectionHeader({
      enabled: true,
      scrollTop: 25,
      displayRows,
      virtualItems,
      itemSize: 19,
    });
    expect(result.stickyRow?.sectionName).toBe('step-build');
  });

  it('should not switch sticky header when scrollTop exceeds linear fallback but is within the first section', () => {
    // Simulates the reported bug: 6000+ lines in section 0 with wrapped
    // content cause the actual scroll offset to surpass the naive
    // `idx * itemSize` estimate for the next section header.
    const displayRows: LogDisplayRow[] = [
      makeSectionHeader(0, 'step-process-output', 1, 6000),
      ...Array.from({ length: 6000 }, (_, i) => makeContentRow(i, i + 2, 0)),
      makeSectionHeader(1, 'step-oci-attach-report', 6002, 10),
      ...Array.from({ length: 10 }, (_, i) => makeContentRow(6000 + i, 6003 + i, 1)),
    ];

    // User is viewing lines around index 4990–5010 within section 0.
    // Wrapped lines cause actual positions to be higher than idx * 19.
    const virtualItems = Array.from({ length: 21 }, (_, i) => {
      const index = 4990 + i;
      // Actual position reflecting variable row heights from wrapping
      const start = 120000 + i * 24;
      return makeVirtualItem(index, start);
    });

    // scrollTop is 119000 — exceeds the naive estimate for section 1
    // (6001 * 19 = 114019) but user is still viewing section 0 content.
    const result = computeStickySectionHeader({
      enabled: true,
      scrollTop: 119000,
      displayRows,
      virtualItems,
      itemSize: 19,
    });

    expect(result.stickyRow?.sectionName).toBe('step-process-output');
  });

  it('should correctly show the second section header when actually scrolled past it', () => {
    const displayRows: LogDisplayRow[] = [
      makeSectionHeader(0, 'step-build', 1, 3),
      makeContentRow(0, 2, 0),
      makeContentRow(1, 3, 0),
      makeContentRow(2, 4, 0),
      makeSectionHeader(1, 'step-test', 5, 2),
      makeContentRow(3, 6, 1),
      makeContentRow(4, 7, 1),
    ];

    // Both section headers are in the virtual window
    const virtualItems = [
      makeVirtualItem(0, 0),
      makeVirtualItem(1, 19),
      makeVirtualItem(2, 38),
      makeVirtualItem(3, 57),
      makeVirtualItem(4, 76),
      makeVirtualItem(5, 95),
      makeVirtualItem(6, 114),
    ];

    const result = computeStickySectionHeader({
      enabled: true,
      scrollTop: 80,
      displayRows,
      virtualItems,
      itemSize: 19,
    });

    expect(result.stickyRow?.sectionName).toBe('step-test');
  });

  it('should compute pushUpOffset when next header approaches', () => {
    const displayRows: LogDisplayRow[] = [
      makeSectionHeader(0, 'step-build', 1, 2),
      makeContentRow(0, 2, 0),
      makeContentRow(1, 3, 0),
      makeSectionHeader(1, 'step-test', 4, 2),
      makeContentRow(2, 5, 1),
    ];

    const virtualItems = [
      makeVirtualItem(0, 0),
      makeVirtualItem(1, 19),
      makeVirtualItem(2, 38),
      makeVirtualItem(3, 57),
      makeVirtualItem(4, 76),
    ];

    // scrollTop = 45: the next header at 57 is close, pushUpOffset
    // should be negative: 57 - 45 - 19 = -7
    const result = computeStickySectionHeader({
      enabled: true,
      scrollTop: 45,
      displayRows,
      virtualItems,
      itemSize: 19,
    });

    expect(result.stickyRow?.sectionName).toBe('step-build');
    expect(result.pushUpOffset).toBe(-7);
  });

  it('should return null when no header has been scrolled past', () => {
    const displayRows: LogDisplayRow[] = [
      makeSectionHeader(0, 'step-build', 1, 3),
      makeContentRow(0, 2, 0),
    ];

    // Header is at position 0, scrollTop is very small but > 0
    // and hasn't reached past the header (header position 0 < scrollTop 5 → current bucket = 0)
    // Actually, headerTop(0) = 0 < 5 so currentBucket = 0, which is correct
    const virtualItems = [makeVirtualItem(0, 0), makeVirtualItem(1, 19)];

    const result = computeStickySectionHeader({
      enabled: true,
      scrollTop: 5,
      displayRows,
      virtualItems,
      itemSize: 19,
    });

    expect(result.stickyRow?.sectionName).toBe('step-build');
  });

  it('should use extrapolation for headers above the virtual window', () => {
    // Scenario: scrolled far down, first section header is well above the
    // visible window. The virtual window starts at index 1000.
    const displayRows: LogDisplayRow[] = [
      makeSectionHeader(0, 'step-build', 1, 5000),
      ...Array.from({ length: 5000 }, (_, i) => makeContentRow(i, i + 2, 0)),
    ];

    const virtualItems = Array.from({ length: 20 }, (_, i) => {
      const index = 1000 + i;
      return makeVirtualItem(index, 20000 + i * 19);
    });

    const result = computeStickySectionHeader({
      enabled: true,
      scrollTop: 19500,
      displayRows,
      virtualItems,
      itemSize: 19,
    });

    // The header at index 0 should be estimated via extrapolation from
    // the first visible item: first.start - (first.index - 0) * 19
    // = 20000 - 1000*19 = 20000 - 19000 = 1000
    // 1000 < 19500, so it's correctly scrolled past
    expect(result.stickyRow?.sectionName).toBe('step-build');
  });
});
