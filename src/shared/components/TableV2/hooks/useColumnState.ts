import { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { useSessionStorage } from '~/shared/hooks/useSessionStorage';
import { type ColumnDefinition, type ColumnState } from '../types';

// Only the `id` field is needed — use Pick to avoid variance issues with TData
type ColumnId = Pick<ColumnDefinition<never>, 'id'>;

type ColumnLayout = Pick<ColumnState, 'visibleColumns' | 'columnOrder'>;
type SortState = Pick<ColumnState, 'sortColumn' | 'sortDirection'>;

/** Derives the default column state from column definitions (all columns visible, no sort). */
function deriveDefaultState(columns: ColumnId[]): ColumnLayout {
  const ids = columns.map((c) => c.id);
  return { visibleColumns: ids, columnOrder: ids };
}

/**
 * Migrates a persisted column state against the current column definitions.
 *
 * Handles schema drift by removing stale IDs and inserting new columns at
 * their definition-relative position. Sort state is managed separately in
 * sessionStorage.
 */
function migrateState(persisted: ColumnLayout, columns: ColumnId[]): ColumnLayout {
  const validIds = new Set(columns.map((c) => c.id));
  const definitionIds = columns.map((c) => c.id);

  const columnOrder = persisted.columnOrder ?? [];
  const visibleColumns = persisted.visibleColumns ?? [];

  // Remove stale IDs from both arrays
  const existingOrder = columnOrder.filter((id) => validIds.has(id));
  const existingVisible = visibleColumns.filter((id) => validIds.has(id));

  // Find new columns not in persisted columnOrder
  const knownIds = new Set(columnOrder);
  const newColumns = definitionIds.filter((id) => !knownIds.has(id));

  // Insert new columns at their definition-relative position
  const mergedOrder = [...existingOrder];
  for (const newId of newColumns) {
    const defIndex = definitionIds.indexOf(newId);
    // Find the rightmost existing column that appears before newId in definition order
    let insertAfterIndex = -1;
    for (let i = defIndex - 1; i >= 0; i--) {
      const idx = mergedOrder.indexOf(definitionIds[i]);
      if (idx !== -1) {
        insertAfterIndex = idx;
        break;
      }
    }
    mergedOrder.splice(insertAfterIndex + 1, 0, newId);
  }

  // New columns are also visible by default
  const mergedVisible = [...existingVisible, ...newColumns];

  return { visibleColumns: mergedVisible, columnOrder: mergedOrder };
}

/**
 * Manages column visibility, order, and sort state with optional persistence.
 *
 * When `key` is provided, column visibility and order are persisted to
 * localStorage, while sorting is persisted to sessionStorage. Layout is
 * automatically migrated when column definitions change. When `key` is
 * `undefined`, state is held in ephemeral React state and resets on unmount.
 *
 * All storage and React state hooks are always called to satisfy the Rules of
 * Hooks — only the relevant state is active based on whether `key` is provided.
 *
 * @typeParam TData - The row data type
 * @param key - Shared storage key. Pass `undefined` for ephemeral mode.
 * @param columns - Current column definitions, used to derive defaults and migrate state.
 * @returns An object with the current `columnState` and a `setColumnState` updater.
 *
 * @example
 * ```tsx
 * // Persisted column state
 * const { columnState, setColumnState } = useColumnState('my-table', columns);
 *
 * // Ephemeral column state (no persistence)
 * const { columnState, setColumnState } = useColumnState(undefined, columns);
 * ```
 */
export function useColumnState<TData>(
  key: string | undefined,
  columns: ColumnDefinition<TData>[],
): { columnState: ColumnState; setColumnState: (state: ColumnState) => void } {
  const defaultState = useMemo(() => deriveDefaultState(columns), [columns]);

  const isPersisted = !!key;

  // Always call the storage hooks to satisfy Rules of Hooks.
  // localStorage hook — active only when key is provided
  const [persistedLayout, setPersistedLayout] = useLocalStorage<ColumnLayout>(
    key ?? '__ephemeral__',
    defaultState,
  );
  const [persistedSort, setPersistedSort, removePersistedSort] = useSessionStorage<SortState>(
    key ?? '__ephemeral__',
  );

  // Ephemeral state — active only when no key is provided
  const [ephemeralState, setEphemeralState] = useState<ColumnState>(defaultState);

  const columnState = useMemo(() => {
    if (!isPersisted) {
      return ephemeralState;
    }
    const layout = persistedLayout ? migrateState(persistedLayout, columns) : defaultState;
    const validSortColumn =
      persistedSort?.sortColumn && columns.some((column) => column.id === persistedSort.sortColumn)
        ? persistedSort.sortColumn
        : undefined;
    return {
      ...layout,
      sortColumn: validSortColumn,
      sortDirection: validSortColumn ? persistedSort?.sortDirection : undefined,
    };
  }, [isPersisted, ephemeralState, persistedLayout, persistedSort, columns, defaultState]);

  const setColumnState = useCallback(
    (state: ColumnState) => {
      if (isPersisted) {
        setPersistedLayout({
          visibleColumns: state.visibleColumns,
          columnOrder: state.columnOrder,
        });
        if (state.sortColumn) {
          setPersistedSort({
            sortColumn: state.sortColumn,
            sortDirection: state.sortDirection,
          });
        } else {
          removePersistedSort();
        }
      } else {
        setEphemeralState(state);
      }
    },
    [isPersisted, setPersistedLayout, setPersistedSort, removePersistedSort],
  );

  return { columnState, setColumnState };
}
