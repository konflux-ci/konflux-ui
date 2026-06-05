import React, { type ReactNode } from 'react';
import { Tbody, Tr, Td, ExpandableRowContent } from '@patternfly/react-table';
import { type Row } from '@tanstack/react-table';
import { type VirtualItem } from '@tanstack/react-virtual';
import { TableRow } from '~/shared/components/TableV2/TableRow';

interface TableBodyProps<TData> {
  rows: Row<TData>[];
  virtualRows: VirtualItem[];
  totalSize: number;
  getRowId: (row: TData) => string;
  enableExpansion?: boolean;
  expandedContent?: (row: TData) => ReactNode;
  visibleColumnCount: number;
  isFetchingNextPage?: boolean;
  measureElement?: (el: HTMLElement | null) => void;
}

export const TableBody = <TData,>({
  rows,
  virtualRows,
  totalSize,
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
    <Tbody data-test="table-body">
      {virtualRows.length > 0 && virtualRows[0].start > 0 && (
        <Tr style={{ height: virtualRows[0].start }} />
      )}
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;
        const rowId = getRowId(row.original);
        return (
          <React.Fragment key={rowId}>
            <TableRow row={row} rowId={rowId} enableExpansion={enableExpansion} />
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
      {isFetchingNextPage && (
        <Tr data-test="table-loading-more">
          <Td colSpan={visibleColumnCount}>Loading more...</Td>
        </Tr>
      )}
    </Tbody>
  );
};
