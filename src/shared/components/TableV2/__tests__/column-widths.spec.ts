import { computeColumnWidths, type ColumnWidth } from '../column-widths';
import { type ColumnDefinition } from '../types';

// Minimal column helper — only fields computeColumnWidths cares about
const col = (
  overrides: Partial<ColumnDefinition<unknown>> & { id: string },
): ColumnDefinition<unknown> => ({
  header: overrides.id,
  accessorFn: () => null,
  ...overrides,
});

describe('computeColumnWidths', () => {
  it('distributes percentage among flex columns by size', () => {
    const columns = [
      col({ id: 'a', size: 3 }),
      col({ id: 'b', size: 2 }),
      col({ id: 'c', size: 1 }),
    ];
    const result = computeColumnWidths(columns, ['a', 'b', 'c']);

    expect(result).toEqual<ColumnWidth[]>([
      { id: 'a', type: 'flex', widthPercent: 50 },
      { id: 'b', type: 'flex', widthPercent: 33 },
      { id: 'c', type: 'flex', widthPercent: 17 },
    ]);
  });

  it('defaults size to 1 when neither size nor width is set', () => {
    const columns = [col({ id: 'a' }), col({ id: 'b' }), col({ id: 'c' })];
    const result = computeColumnWidths(columns, ['a', 'b', 'c']);

    expect(result).toEqual<ColumnWidth[]>([
      { id: 'a', type: 'flex', widthPercent: 33 },
      { id: 'b', type: 'flex', widthPercent: 33 },
      { id: 'c', type: 'flex', widthPercent: 33 },
    ]);
  });

  it('passes through fixed width values', () => {
    const columns = [col({ id: 'a', width: '48px' }), col({ id: 'b', width: 'auto' })];
    const result = computeColumnWidths(columns, ['a', 'b']);

    expect(result).toEqual<ColumnWidth[]>([
      { id: 'a', type: 'fixed', fixedWidth: '48px' },
      { id: 'b', type: 'fixed', fixedWidth: 'auto' },
    ]);
  });

  it('handles mixed flex and fixed columns', () => {
    const columns = [
      col({ id: 'checkbox', width: '48px' }),
      col({ id: 'name', size: 3 }),
      col({ id: 'status', size: 1 }),
      col({ id: 'actions', width: '120px' }),
    ];
    const result = computeColumnWidths(columns, ['checkbox', 'name', 'status', 'actions']);

    expect(result).toEqual<ColumnWidth[]>([
      { id: 'checkbox', type: 'fixed', fixedWidth: '48px' },
      { id: 'name', type: 'flex', widthPercent: 75 },
      { id: 'status', type: 'flex', widthPercent: 25 },
      { id: 'actions', type: 'fixed', fixedWidth: '120px' },
    ]);
  });

  it('gives single flex column 100%', () => {
    const columns = [col({ id: 'only' })];
    const result = computeColumnWidths(columns, ['only']);

    expect(result).toEqual<ColumnWidth[]>([{ id: 'only', type: 'flex', widthPercent: 100 }]);
  });

  it('redistributes widths when some flex columns are hidden', () => {
    const columns = [
      col({ id: 'a', size: 3 }),
      col({ id: 'b', size: 2 }),
      col({ id: 'c', size: 1 }),
    ];
    // hide column 'b'
    const result = computeColumnWidths(columns, ['a', 'c']);

    expect(result).toEqual<ColumnWidth[]>([
      { id: 'a', type: 'flex', widthPercent: 75 },
      { id: 'c', type: 'flex', widthPercent: 25 },
    ]);
  });

  it('returns only fixed widths when all flex columns are hidden', () => {
    const columns = [
      col({ id: 'flex1', size: 2 }),
      col({ id: 'fixed1', width: '48px' }),
      col({ id: 'fixed2', width: '120px' }),
    ];
    const result = computeColumnWidths(columns, ['fixed1', 'fixed2']);

    expect(result).toEqual<ColumnWidth[]>([
      { id: 'fixed1', type: 'fixed', fixedWidth: '48px' },
      { id: 'fixed2', type: 'fixed', fixedWidth: '120px' },
    ]);
  });

  it('returns empty array when visibleColumns is empty', () => {
    const columns = [col({ id: 'a' }), col({ id: 'b' })];
    const result = computeColumnWidths(columns, []);

    expect(result).toEqual<ColumnWidth[]>([]);
  });

  it('gives 0% to a flex column with size 0', () => {
    const columns = [col({ id: 'a', size: 2 }), col({ id: 'b', size: 0 })];
    const result = computeColumnWidths(columns, ['a', 'b']);

    expect(result).toEqual<ColumnWidth[]>([
      { id: 'a', type: 'flex', widthPercent: 100 },
      { id: 'b', type: 'flex', widthPercent: 0 },
    ]);
  });
});
