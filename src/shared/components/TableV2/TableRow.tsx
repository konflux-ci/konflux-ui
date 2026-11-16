import { type ReactNode } from 'react';
import { Tr, Td } from '@patternfly/react-table';
import { flexRender, type Row } from '@tanstack/react-table';

/** Props for the {@link TableRow} component. */
interface TableRowProps<TData> {
  /** The TanStack row instance to render. */
  row: Row<TData>;
  /** Unique row identifier, set as `data-id` on the `<Tr>`. */
  rowId: string;
  /** Virtual index used by PatternFly expand/select controls. */
  virtualIndex: number;
  /** Whether to render an expand/collapse toggle cell. */
  enableExpansion?: boolean;
  /** Whether this row controls an expanded content row. */
  isContentExpanded?: boolean;
  /** Whether to render a row selection checkbox cell. */
  enableRowSelection?: boolean;
  /** Column ID of the currently expanded compound cell, if any. */
  compoundExpandedColumnId?: string;
  /** Toggles the compound expansion for a column in this row. */
  onCompoundExpandedChange?: (columnId: string) => void;
  /** Stable ID prefix for PatternFly compound expansion controls. */
  compoundExpandId?: string;
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
export const TableRow = <TData,>({
  row,
  rowId,
  virtualIndex,
  enableExpansion,
  isContentExpanded,
  enableRowSelection,
  compoundExpandedColumnId,
  onCompoundExpandedChange,
  compoundExpandId,
}: TableRowProps<TData>) => {
  const leadingCellCount = Number(Boolean(enableExpansion)) + Number(Boolean(enableRowSelection));

  return (
    <Tr role="row" data-test="table-row" data-id={rowId} isContentExpanded={isContentExpanded}>
      {enableRowSelection && (
        <Td
          select={{
            rowIndex: virtualIndex,
            onSelect: (_event, isSelected) => {
              row.toggleSelected(isSelected);
            },
            isSelected: row.getIsSelected(),
          }}
        />
      )}
      {enableExpansion && (
        <Td
          expand={{
            rowIndex: virtualIndex,
            isExpanded: row.getIsExpanded(),
            onToggle: row.getToggleExpandedHandler(),
          }}
        />
      )}
      {row.getVisibleCells().map((cell, cellIndex) => {
        const expandedContent = (
          cell.column.columnDef.meta as { expandedContent?: (row: TData) => ReactNode } | undefined
        )?.expandedContent;

        return (
          <Td
            key={cell.id}
            dataLabel={
              typeof cell.column.columnDef.header === 'string'
                ? cell.column.columnDef.header
                : undefined
            }
            compoundExpand={
              expandedContent
                ? {
                    isExpanded: compoundExpandedColumnId === cell.column.id,
                    onToggle: () => onCompoundExpandedChange?.(cell.column.id),
                    expandId: compoundExpandId,
                    rowIndex: virtualIndex,
                    columnIndex: leadingCellCount + cellIndex,
                  }
                : undefined
            }
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </Td>
        );
      })}
    </Tr>
  );
};
