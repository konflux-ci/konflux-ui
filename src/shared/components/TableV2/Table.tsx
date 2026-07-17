import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Table as PfTable } from '@patternfly/react-table';
import { getParentScrollableElement } from '~/shared/hooks';
import { computeColumnWidths } from './column-widths';
import { useColumnState } from './hooks/useColumnState';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { useResponsiveColumns } from './hooks/useResponsiveColumns';
import { useTable } from './hooks/useTable';
import { useVirtualization } from './hooks/useVirtualization';
import { TableBody } from './TableBody';
import { TableHeader } from './TableHeader';
import { type TableProps } from './types';

/**
 * Main TableV2 component — the primary orchestrator for rendering data tables.
 *
 * Composes several hooks and sub-components into a full-featured table:
 * - **Column state** (`useColumnState`) — persisted visibility, order, and sort
 * - **Responsive columns** (`useResponsiveColumns`) — hides columns at breakpoints
 * - **Core table** (`useTable`) — TanStack Table instance with sorting and expansion
 * - **Virtualization** (`useVirtualization`) — only renders visible rows for performance
 * - **Infinite scroll** (`useInfiniteScroll`) — triggers data fetching near the bottom
 * - **Column widths** (`computeColumnWidths`) — flex and fixed width calculation
 *
 * Renders a PatternFly `Table` with `TableHeader` and `TableBody` sub-components.
 *
 * @typeParam TData - The row data type
 *
 * @example
 * Basic usage:
 * ```tsx
 * <Table
 *   data={pipelineRuns}
 *   columns={columns}
 *   getRowId={(row) => row.metadata.uid}
 *   aria-label="Pipeline runs"
 * />
 * ```
 *
 * @example
 * Full-featured usage with sorting, expansion, infinite scroll, and persistence:
 * ```tsx
 * <Table
 *   data={pipelineRuns}
 *   columns={columns}
 *   getRowId={(row) => row.metadata.uid}
 *   aria-label="Pipeline runs"
 *   enableSorting
 *   enableExpansion
 *   expandedContent={(row) => <RunDetails run={row} />}
 *   columnStateKey="pipeline-runs-table"
 *   hasNextPage={hasNextPage}
 *   isFetchingNextPage={isFetchingNextPage}
 *   fetchNextPage={fetchNextPage}
 * />
 * ```
 */
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
  const [tableNode, setTableNode] = useState<HTMLDivElement | null>(null);
  const tableRef = useCallback((node: HTMLDivElement | null) => {
    setTableNode(node);
  }, []);

  // Find the scroll container: external prop > nearest scrollable ancestor > null
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (scrollElementProp) {
      setScrollElement(scrollElementProp);
      return;
    }
    if (tableNode) {
      setScrollElement(getParentScrollableElement(tableNode) ?? null);
    } else {
      setScrollElement(null);
    }
  }, [scrollElementProp, tableNode]);

  // Tracks how far the table is from the top of the scroll container so the
  // virtualizer can correctly offset row positions (accounts for toolbars, headers, etc.).
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    if (!tableNode || !scrollElement) {
      setScrollMargin(0);
      return;
    }

    const recalculate = () => {
      const tableRect = tableNode.getBoundingClientRect();
      const scrollRect = scrollElement.getBoundingClientRect();
      setScrollMargin(tableRect.top - scrollRect.top + scrollElement.scrollTop);
    };

    recalculate();

    const observer = new ResizeObserver(recalculate);
    observer.observe(scrollElement);
    observer.observe(tableNode);

    return () => observer.disconnect();
  }, [tableNode, scrollElement]);

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
    scrollMargin,
  });

  useInfiniteScroll({
    virtualRows,
    totalCount: rows.length,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage: !!isFetchingNextPage,
    fetchNextPage: fetchNextPage ?? (() => undefined),
    scrollElement,
  });

  const columnWidths = computeColumnWidths(columns, columnState.visibleColumns);
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div data-test="table-v2" ref={tableRef}>
      <PfTable aria-label={ariaLabel} variant="compact" isExpandable={enableExpansion}>
        <TableHeader table={table} columnWidths={columnWidths} enableExpansion={enableExpansion} />
        <TableBody
          rows={rows}
          virtualRows={virtualRows}
          totalSize={virtualizer.getTotalSize()}
          measureElement={virtualizer.measureElement}
          getRowId={getRowId}
          enableExpansion={enableExpansion}
          expandedContent={expandedContent}
          visibleColumnCount={visibleColumnCount}
          isFetchingNextPage={isFetchingNextPage}
          scrollMargin={scrollMargin}
        />
      </PfTable>
    </div>
  );
};
