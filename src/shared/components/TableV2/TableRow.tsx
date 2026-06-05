import { Tr, Td } from '@patternfly/react-table';
import { flexRender, type Row } from '@tanstack/react-table';

interface TableRowProps<TData> {
  row: Row<TData>;
  rowId: string;
  enableExpansion?: boolean;
}

export const TableRow = <TData,>({ row, rowId, enableExpansion }: TableRowProps<TData>) => {
  return (
    <Tr data-test="table-row" data-id={rowId}>
      {enableExpansion && (
        <Td
          expand={{
            rowIndex: 0,
            isExpanded: row.getIsExpanded(),
            onToggle: row.getToggleExpandedHandler(),
          }}
        />
      )}
      {row.getVisibleCells().map((cell) => (
        <Td
          key={cell.id}
          dataLabel={
            typeof cell.column.columnDef.header === 'string'
              ? cell.column.columnDef.header
              : undefined
          }
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Td>
      ))}
    </Tr>
  );
};
