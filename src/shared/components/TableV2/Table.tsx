import { useRef } from 'react';
import { Table as PfTable } from '@patternfly/react-table';
import { computeColumnWidths } from './column-widths';
import { useColumnState } from './hooks/useColumnState';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { useResponsiveColumns } from './hooks/useResponsiveColumns';
import { useTable } from './hooks/useTable';
import { useVirtualization } from './hooks/useVirtualization';
import { TableBody } from './TableBody';
import { TableHeader } from './TableHeader';
import { type TableProps } from './types';

export const Table = <TData,>({
  data,
  columns,
  getRowId,
  'aria-label': ariaLabel,
  meta,
  enableSorting,
  enableExpansion,
  expandedContent,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  columnStateKey,
  scrollElement: scrollElementProp,
}: TableProps<TData>) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollElement = scrollElementProp ?? scrollContainerRef.current;

  const { columnState, setColumnState } = useColumnState(columnStateKey, columns);
  const { columnVisibility } = useResponsiveColumns(columns);

  const { table, rows } = useTable({
    data,
    columns,
    getRowId,
    columnState,
    setColumnState,
    responsiveColumnVisibility: columnVisibility,
    enableSorting,
    enableExpansion,
    meta,
  });

  const { virtualizer, virtualRows } = useVirtualization({
    count: rows.length,
    scrollElement,
  });

  useInfiniteScroll({
    virtualizer,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage: !!isFetchingNextPage,
    fetchNextPage: fetchNextPage ?? (() => undefined),
  });

  const columnWidths = computeColumnWidths(columns, columnState.visibleColumns);
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div
      data-test="table-v2"
      ref={scrollContainerRef}
      style={{ overflow: 'auto', height: '100%', minHeight: 0 }}
    >
      <PfTable aria-label={ariaLabel} isStriped variant="compact" isExpandable={enableExpansion}>
        <TableHeader table={table} columnWidths={columnWidths} enableExpansion={enableExpansion} />
        <TableBody
          rows={rows}
          virtualRows={virtualRows}
          totalSize={virtualizer.getTotalSize()}
          getRowId={getRowId}
          enableExpansion={enableExpansion}
          expandedContent={expandedContent}
          visibleColumnCount={visibleColumnCount}
          isFetchingNextPage={isFetchingNextPage}
        />
      </PfTable>
    </div>
  );
};
