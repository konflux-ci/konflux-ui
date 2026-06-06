import { Tr, Td } from '@patternfly/react-table';
import { flexRender, type Row } from '@tanstack/react-table';

/** Props for the {@link TableRow} component. */
interface TableRowProps<TData> {
  /** The TanStack row instance to render. */
  row: Row<TData>;
  /** Unique row identifier, set as `data-id` on the `<Tr>`. */
  rowId: string;
  /** Whether to render an expand/collapse toggle cell. */
  enableExpansion?: boolean;
}

/**
 * Renders a single table row with its cells.
 *
 * Uses TanStack's `flexRender` to render each cell according to its column
 * definition. When expansion is enabled, adds a leading toggle cell.
 * Sets `dataLabel` on each `<Td>` for PatternFly's responsive table behavior.
 *
 * @typeParam TData - The row data type
 */
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
