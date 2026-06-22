import { Thead, Tr, Th, type ThProps } from '@patternfly/react-table';
import { flexRender, type Table } from '@tanstack/react-table';
import { type ColumnWidth } from './column-widths';

/** Props for the {@link TableHeader} component. */
interface TableHeaderProps<TData> {
  /** The TanStack Table instance. */
  table: Table<TData>;
  /** Computed column widths from `computeColumnWidths`. */
  columnWidths: ColumnWidth[];
  /** Whether to render an empty expand/collapse header cell. */
  enableExpansion?: boolean;
}

/**
 * Renders the table header row with column labels, widths, and sort indicators.
 *
 * Applies flex or fixed widths from `columnWidths` and wires up PatternFly's
 * sort props for sortable columns. When expansion is enabled, adds an empty
 * leading `<Th>` for the expand toggle column.
 *
 * @typeParam TData - The row data type
 */
export const TableHeader = <TData,>({
  table,
  columnWidths,
  enableExpansion,
}: TableHeaderProps<TData>) => {
  const widthMap = new Map(columnWidths.map((w) => [w.id, w]));

  return (
    <Thead data-test="table-header">
      {table.getHeaderGroups().map((headerGroup) => (
        <Tr role="row" key={headerGroup.id}>
          {enableExpansion && <Th />}
          {headerGroup.headers.map((header, headerIndex) => {
            const colWidth = widthMap.get(header.column.id);
            const widthProps: Partial<ThProps> = {};

            if (colWidth?.type === 'flex') {
              widthProps.width = colWidth.widthPercent as ThProps['width'];
            } else if (colWidth?.type === 'fixed') {
              widthProps.style = { width: colWidth.fixedWidth };
            }

            const sortProps: Pick<ThProps, 'sort'> = header.column.getCanSort()
              ? {
                  sort: {
                    sortBy: {
                      index: headerIndex,
                      direction: header.column.getIsSorted() || undefined,
                    },
                    onSort: header.column.getToggleSortingHandler(),
                    columnIndex: headerIndex,
                  },
                }
              : {};

            return (
              <Th key={header.id} {...widthProps} {...sortProps}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </Th>
            );
          })}
        </Tr>
      ))}
    </Thead>
  );
};
