import { act, renderHook } from '@testing-library/react';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { useColumnState } from '~/shared/components/TableV2/hooks/useColumnState';

interface TestRow {
  id: string;
  name: string;
}

const columns: ColumnDefinition<TestRow>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name, sortable: true },
  { id: 'id', header: 'ID', accessorFn: (row) => row.id },
];

const columnStateKey = 'table-state-storage-test';

describe('useColumnState storage separation', () => {
  beforeEach(() => {
    window.localStorage.removeItem(columnStateKey);
    window.sessionStorage.removeItem(columnStateKey);
  });

  it('loads layout from localStorage and sorting from sessionStorage', () => {
    window.localStorage.setItem(
      columnStateKey,
      JSON.stringify({
        visibleColumns: ['id', 'name'],
        columnOrder: ['id', 'name'],
        sortColumn: 'name',
        sortDirection: 'desc',
      }),
    );
    window.sessionStorage.setItem(
      columnStateKey,
      JSON.stringify({ sortColumn: 'id', sortDirection: 'asc' }),
    );

    const { result } = renderHook(() => useColumnState(columnStateKey, columns));

    expect(result.current.columnState.visibleColumns).toEqual(['id', 'name']);
    expect(result.current.columnState.columnOrder).toEqual(['id', 'name']);
    expect(result.current.columnState.sortColumn).toBe('id');
    expect(result.current.columnState.sortDirection).toBe('asc');
  });

  it('ignores legacy sort fields in localStorage when session sorting is absent', () => {
    window.localStorage.setItem(
      columnStateKey,
      JSON.stringify({
        visibleColumns: ['id', 'name'],
        columnOrder: ['id', 'name'],
        sortColumn: 'name',
        sortDirection: 'desc',
      }),
    );

    const { result } = renderHook(() => useColumnState(columnStateKey, columns));

    expect(result.current.columnState.sortColumn).toBeUndefined();
    expect(result.current.columnState.sortDirection).toBeUndefined();
  });

  it('writes sorting only to sessionStorage and clears it when the sort is removed', () => {
    const { result } = renderHook(() => useColumnState(columnStateKey, columns));

    act(() => {
      result.current.setColumnState({
        visibleColumns: ['name', 'id'],
        columnOrder: ['name', 'id'],
        sortColumn: 'name',
        sortDirection: 'desc',
      });
    });

    expect(JSON.parse(window.localStorage.getItem(columnStateKey) ?? '{}')).toEqual({
      visibleColumns: ['name', 'id'],
      columnOrder: ['name', 'id'],
    });
    expect(JSON.parse(window.sessionStorage.getItem(columnStateKey) ?? '{}')).toEqual({
      sortColumn: 'name',
      sortDirection: 'desc',
    });

    act(() => {
      result.current.setColumnState({
        visibleColumns: ['name', 'id'],
        columnOrder: ['name', 'id'],
      });
    });

    expect(window.sessionStorage.getItem(columnStateKey)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(columnStateKey) ?? '{}')).toEqual({
      visibleColumns: ['name', 'id'],
      columnOrder: ['name', 'id'],
    });
  });

  it('synchronizes session sorting between hooks sharing a columnStateKey', () => {
    const { result } = renderHook(() => [
      useColumnState(columnStateKey, columns),
      useColumnState(columnStateKey, columns),
    ]);

    act(() => {
      result.current[0].setColumnState({
        visibleColumns: ['name', 'id'],
        columnOrder: ['name', 'id'],
        sortColumn: 'name',
        sortDirection: 'asc',
      });
    });

    expect(result.current[1].columnState.sortColumn).toBe('name');
    expect(result.current[1].columnState.sortDirection).toBe('asc');
  });
});
