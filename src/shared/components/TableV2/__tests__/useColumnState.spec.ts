import { renderHook, act } from '@testing-library/react';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { useColumnState } from '~/shared/components/TableV2/hooks/useColumnState';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';

jest.mock('~/shared/hooks/useLocalStorage');

const mockUseLocalStorage = jest.mocked(useLocalStorage);

// --- Test data ---

interface TestRow {
  id: string;
  name: string;
  status: string;
}

const columns: ColumnDefinition<TestRow>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name },
  { id: 'status', header: 'Status', accessorFn: (row) => row.status },
  { id: 'id', header: 'ID', accessorFn: (row) => row.id },
];

describe('useColumnState', () => {
  let mockSetValue: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetValue = jest.fn();
    // Default: no persisted state
    mockUseLocalStorage.mockReturnValue([undefined, mockSetValue, jest.fn()]);
  });

  describe('default state derivation', () => {
    it('derives visibleColumns from column definitions when no persisted state exists', () => {
      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.visibleColumns).toEqual(['name', 'status', 'id']);
    });

    it('derives default state with no sort', () => {
      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.sortColumn).toBeUndefined();
      expect(result.current.columnState.sortDirection).toBeUndefined();
    });
  });

  describe('persistence round-trip', () => {
    it('calls useLocalStorage with the provided key', () => {
      renderHook(() => useColumnState('my-table-key', columns));

      expect(mockUseLocalStorage).toHaveBeenCalledWith('my-table-key', expect.any(Object));
    });

    it('persists state via setColumnState', () => {
      const { result } = renderHook(() => useColumnState('test-key', columns));

      act(() => {
        result.current.setColumnState({
          visibleColumns: ['name', 'status'],
          sortColumn: 'name',
          sortDirection: 'asc',
        });
      });

      expect(mockSetValue).toHaveBeenCalledWith({
        visibleColumns: ['name', 'status'],
        allColumns: ['name', 'status', 'id'],
        sortColumn: 'name',
        sortDirection: 'asc',
      });
    });

    it('returns persisted state when available', () => {
      const persisted = {
        visibleColumns: ['status', 'name', 'id'],
        sortColumn: 'status',
        sortDirection: 'desc' as const,
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.visibleColumns).toEqual(['status', 'name', 'id']);
      expect(result.current.columnState.sortColumn).toBe('status');
      expect(result.current.columnState.sortDirection).toBe('desc');
    });
  });

  describe('schema migration: removed columns', () => {
    it('removes column IDs from persisted state that no longer exist in definitions', () => {
      const persisted = {
        visibleColumns: ['name', 'deleted-col', 'status', 'id'],
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.visibleColumns).toEqual(['name', 'status', 'id']);
      expect(result.current.columnState.visibleColumns).not.toContain('deleted-col');
    });

    it('clears sortColumn if the sorted column was removed', () => {
      const persisted = {
        visibleColumns: ['name', 'status', 'id'],
        sortColumn: 'deleted-col',
        sortDirection: 'asc' as const,
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.sortColumn).toBeUndefined();
      expect(result.current.columnState.sortDirection).toBeUndefined();
    });
  });

  describe('schema migration: added columns', () => {
    it('appends new column IDs that exist in definitions but not in persisted state', () => {
      const persisted = {
        visibleColumns: ['name'],
        allColumns: ['name'],
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.visibleColumns).toEqual(['name', 'status', 'id']);
    });

    it('should not re-add intentionally hidden columns during migration', () => {
      // 'status' was known but intentionally hidden by the user
      const persisted = {
        visibleColumns: ['name', 'id'],
        allColumns: ['name', 'status', 'id'],
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.visibleColumns).toEqual(['name', 'id']);
      expect(result.current.columnState.visibleColumns).not.toContain('status');
    });

    it('should add genuinely new columns during migration', () => {
      // 'status' was not known at all — it's a genuinely new column
      const persisted = {
        visibleColumns: ['name', 'id'],
        allColumns: ['name', 'id'],
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.visibleColumns).toEqual(['name', 'id', 'status']);
    });

    it('should handle legacy state without allColumns (backward compat)', () => {
      // No allColumns — falls back to old behavior (treats missing columns as new)
      const persisted = {
        visibleColumns: ['name', 'id'],
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.visibleColumns).toEqual(['name', 'id', 'status']);
    });
  });

  describe('ephemeral mode', () => {
    it('does not persist to localStorage when key is undefined', () => {
      const { result } = renderHook(() => useColumnState(undefined, columns));

      act(() => {
        result.current.setColumnState({
          visibleColumns: ['name'],
          sortColumn: 'name',
          sortDirection: 'desc',
        });
      });

      // useLocalStorage is called (Rules of Hooks) but setValue should not be used
      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it('does not persist to localStorage when key is empty string', () => {
      const { result } = renderHook(() => useColumnState('', columns));

      act(() => {
        result.current.setColumnState({
          visibleColumns: ['name'],
          sortColumn: 'name',
          sortDirection: 'asc',
        });
      });

      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it('uses React state in ephemeral mode and supports setColumnState', () => {
      const { result } = renderHook(() => useColumnState(undefined, columns));

      expect(result.current.columnState.visibleColumns).toEqual(['name', 'status', 'id']);

      act(() => {
        result.current.setColumnState({
          visibleColumns: ['name'],
          sortColumn: 'name',
          sortDirection: 'desc',
        });
      });

      expect(result.current.columnState.visibleColumns).toEqual(['name']);
      expect(result.current.columnState.sortColumn).toBe('name');
      expect(result.current.columnState.sortDirection).toBe('desc');
    });
  });

  describe('sort state persistence', () => {
    it('saves sort column and direction', () => {
      const { result } = renderHook(() => useColumnState('test-key', columns));

      act(() => {
        result.current.setColumnState({
          visibleColumns: ['name', 'status', 'id'],
          sortColumn: 'name',
          sortDirection: 'asc',
        });
      });

      expect(mockSetValue).toHaveBeenCalledWith(
        expect.objectContaining({
          allColumns: ['name', 'status', 'id'],
          sortColumn: 'name',
          sortDirection: 'asc',
        }),
      );
    });

    it('restores persisted sort state', () => {
      const persisted = {
        visibleColumns: ['name', 'status', 'id'],
        sortColumn: 'status',
        sortDirection: 'asc' as const,
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.sortColumn).toBe('status');
      expect(result.current.columnState.sortDirection).toBe('asc');
    });
  });

  describe('column ordering', () => {
    it('preserves persisted visibleColumns order', () => {
      const persisted = {
        visibleColumns: ['id', 'status', 'name'],
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      expect(result.current.columnState.visibleColumns).toEqual(['id', 'status', 'name']);
    });

    it('appends new columns after existing order', () => {
      const persisted = {
        visibleColumns: ['status'],
        allColumns: ['status'],
      };
      mockUseLocalStorage.mockReturnValue([persisted, mockSetValue, jest.fn()]);

      const { result } = renderHook(() => useColumnState('test-key', columns));

      // 'status' keeps its position, 'name' and 'id' are appended as new
      expect(result.current.columnState.visibleColumns).toEqual(['status', 'name', 'id']);
    });
  });
});
