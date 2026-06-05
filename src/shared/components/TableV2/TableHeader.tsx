import { Thead, Tr, Th, type ThProps } from '@patternfly/react-table';
import { flexRender, type Table } from '@tanstack/react-table';
import { type ColumnWidth } from './column-widths';

interface TableHeaderProps<TData> {
  table: Table<TData>;
  columnWidths: ColumnWidth[];
  enableExpansion?: boolean;
}

export const TableHeader = <TData,>({
  table,
  columnWidths,
  enableExpansion,
}: TableHeaderProps<TData>) => {
  const widthMap = new Map(columnWidths.map((w) => [w.id, w]));

  return (
    <Thead data-test="table-header">
      {table.getHeaderGroups().map((headerGroup) => (
        <Tr key={headerGroup.id}>
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
