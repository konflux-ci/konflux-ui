import { type Row } from '@tanstack/react-table';
import { type VirtualItem } from '@tanstack/react-virtual';

interface MockCell {
  id: string;
  value: string;
  header: string;
}

/**
 * Creates a minimal mock TanStack Row object for testing.
 *
 * - When `cells` is omitted, `getVisibleCells()` returns an empty array
 *   (suitable for TableBody tests where TableRow is mocked).
 * - When `cells` is provided, each cell includes `column.id`, `columnDef.cell`,
 *   and `getContext()` (suitable for TableRow tests).
 */
export function createMockRow<TData = Record<string, unknown>>(
  id: string,
  options?: {
    cells?: MockCell[];
    expanded?: boolean;
    selected?: boolean;
    original?: TData;
  },
): Row<TData> {
  const cells = options?.cells;
  const expanded = options?.expanded ?? false;
  const selected = options?.selected ?? false;

  return {
    id,
    original: (options?.original ?? { id }) as TData,
    getVisibleCells: () =>
      cells
        ? cells.map((c) => ({
            id: c.id,
            column: {
              id: c.id,
              columnDef: { cell: () => c.value, header: c.header },
            },
            getContext: () => ({ getValue: () => c.value }),
          }))
        : [],
    getIsExpanded: () => expanded,
    getToggleExpandedHandler: () => jest.fn(),
    getIsSelected: () => selected,
    toggleSelected: jest.fn(),
  } as unknown as Row<TData>;
}

/**
 * Creates an array of mock VirtualItem objects for testing virtualized tables.
 */
export function createMockVirtualRows(count: number, rowHeight = 44): VirtualItem[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    start: i * rowHeight,
    size: rowHeight,
    end: (i + 1) * rowHeight,
    key: `row-${i}`,
    lane: 0,
    measureElement: jest.fn(),
  })) as unknown as VirtualItem[];
}
