import { type ColumnDefinition } from './types';

export type ColumnWidth =
  | { id: string; type: 'flex'; widthPercent: number }
  | { id: string; type: 'fixed'; fixedWidth: string };

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
