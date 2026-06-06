import { type ColumnDefinition } from './types';

/**
 * Computed width for a single column. Either a flex percentage of available
 * space or a fixed CSS width string.
 */
export type ColumnWidth =
  | { id: string; type: 'flex'; widthPercent: number }
  | { id: string; type: 'fixed'; fixedWidth: string };

/**
 * Computes the rendered width of each visible column.
 *
 * Columns with a `width` property get a fixed width. All other columns share
 * the remaining space proportionally based on their `size` values (default: 1).
 *
 * @typeParam TData - The row data type
 * @param columns - All column definitions (including hidden ones)
 * @param visibleColumns - Ordered list of visible column IDs
 * @returns An array of `ColumnWidth` objects for each visible column
 *
 * @example
 * ```tsx
 * const widths = computeColumnWidths(columns, columnState.visibleColumns);
 * // [
 * //   { id: 'name', type: 'flex', widthPercent: 60 },
 * //   { id: 'actions', type: 'fixed', fixedWidth: '120px' },
 * //   { id: 'status', type: 'flex', widthPercent: 40 },
 * // ]
 * ```
 */
export const computeColumnWidths = <TData>(
  columns: ColumnDefinition<TData>[],
  visibleColumns: string[],
): ColumnWidth[] => {
  const visibleSet = new Set(visibleColumns);
  const visible = columns.filter((c) => visibleSet.has(c.id));

  const totalFlexSize = visible.filter((c) => !c.width).reduce((sum, c) => sum + (c.size ?? 1), 0);

  return visible.map((col): ColumnWidth => {
    if (col.width) {
      return { id: col.id, type: 'fixed', fixedWidth: col.width };
    }
    const size = col.size ?? 1;
    const widthPercent = totalFlexSize > 0 ? Math.round((size / totalFlexSize) * 100) : 0;
    return { id: col.id, type: 'flex', widthPercent };
  });
};
