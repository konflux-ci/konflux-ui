import React, { type ReactNode } from 'react';
import { Skeleton } from '@patternfly/react-core';
import { Tbody, Tr, Td, ExpandableRowContent } from '@patternfly/react-table';
import { type Row } from '@tanstack/react-table';
import { type VirtualItem } from '@tanstack/react-virtual';
import { TableRow } from '~/shared/components/TableV2/TableRow';

/** Props for the {@link TableBody} component. */
interface TableBodyProps<TData> {
  /** All rows from the table model. */
  rows: Row<TData>[];
  /** Virtual items from the virtualizer — only these are rendered in the DOM. */
  virtualRows: VirtualItem[];
  /** Total pixel height of all rows (used for spacer calculation). */
  totalSize: number;
  /** Callback from virtualizer to measure a row element for dynamic height. */
  measureElement: (el: HTMLElement | null) => void;
  /** Returns a unique, stable string ID for a given row. */
  getRowId: (row: TData) => string;
  /** Whether rows are expandable. */
  enableExpansion?: boolean;
  /** Render function for expanded row content. */
  expandedContent?: (row: TData) => ReactNode;
  /** Number of visible columns, used for `colSpan` on expanded content and loading rows. */
  visibleColumnCount: number;
  /** Whether the next page is being fetched. Shows skeleton rows when `true`. */
  isFetchingNextPage?: boolean;
}

/**
 * Renders the virtualized table body.
 *
 * Only rows visible in the viewport (plus overscan) are rendered. Top and
 * bottom spacer `<Tr>` elements maintain correct scroll height. When a row
 * is expanded, its expanded content is rendered in a full-width row below it.
 *
 * Shows skeleton loading rows when `isFetchingNextPage` is `true`.
 *
 * @typeParam TData - The row data type
 */
export const TableBody = <TData,>({
  rows,
  virtualRows,
  totalSize,
  measureElement,
  getRowId,
  enableExpansion,
  expandedContent,
  visibleColumnCount,
  isFetchingNextPage,
}: TableBodyProps<TData>) => {
  const lastVirtualRow = virtualRows[virtualRows.length - 1];
  const bottomSpacerHeight = lastVirtualRow
    ? totalSize - (lastVirtualRow.start + lastVirtualRow.size)
    : 0;

  return (
    <Tbody data-test="table-body" style={{ overflowAnchor: 'none' }}>
      {virtualRows.length > 0 && virtualRows[0].start > 0 && (
        <Tr style={{ height: virtualRows[0].start }} />
      )}
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;
        const rowId = getRowId(row.original);
        return (
          <React.Fragment key={rowId}>
            <TableRow
              row={row}
              rowId={rowId}
              virtualIndex={virtualRow.index}
              measureElement={measureElement}
              enableExpansion={enableExpansion}
            />
            {enableExpansion && row.getIsExpanded() && expandedContent && (
              <Tr>
                <Td colSpan={visibleColumnCount}>
                  <ExpandableRowContent>{expandedContent(row.original)}</ExpandableRowContent>
                </Td>
              </Tr>
            )}
          </React.Fragment>
        );
      })}
      {bottomSpacerHeight > 0 && <Tr style={{ height: bottomSpacerHeight }} />}
      {isFetchingNextPage &&
        Array.from({ length: 3 }, (_, rowIdx) => (
          <Tr key={`skeleton-${rowIdx}`} data-test="table-loading-more">
            {Array.from({ length: visibleColumnCount }, (__, colIdx) => (
              <Td key={colIdx}>
                <Skeleton width={`${50 + ((rowIdx + colIdx) % 4) * 10}%`} />
              </Td>
            ))}
          </Tr>
        ))}
    </Tbody>
  );
};
