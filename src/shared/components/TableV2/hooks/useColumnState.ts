import { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { type ColumnDefinition, type ColumnState } from '../types';

// Only the `id` field is needed — use Pick to avoid variance issues with TData
type ColumnId = Pick<ColumnDefinition<never>, 'id'>;

/** Derives the default column state from column definitions (all columns visible, no sort). */
function deriveDefaultState(columns: ColumnId[]): ColumnState {
  const ids = columns.map((c) => c.id);
  return { visibleColumns: ids, columnOrder: ids };
}

/**
 * Migrates a persisted column state against the current column definitions.
 *
 * Handles schema drift: removes IDs for columns that no longer exist,
 * inserts new columns at their definition-relative position,
 * and clears the sort if the sorted column was removed.
 */
function migrateState(persisted: ColumnState, columns: ColumnId[]): ColumnState {
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

  // Clear sort if sorted column was removed
  const sortColumn =
    persisted.sortColumn && validIds.has(persisted.sortColumn) ? persisted.sortColumn : undefined;
  const sortDirection = sortColumn ? persisted.sortDirection : undefined;

  return {
    visibleColumns: mergedVisible,
    columnOrder: mergedOrder,
    sortColumn,
    sortDirection,
  };
}

/**
 * Manages column visibility, order, and sort state with optional localStorage
 * persistence.
 *
 * When `key` is provided, state is persisted to localStorage and automatically
 * migrated when column definitions change (stale columns removed, new columns
 * appended). When `key` is `undefined`, state is held in ephemeral React state
 * and resets on unmount.
 *
 * Both hooks (`useLocalStorage` and `useState`) are always called to satisfy
 * the Rules of Hooks — only one is active based on whether `key` is provided.
 *
 * @typeParam TData - The row data type
 * @param key - LocalStorage key for persistence. Pass `undefined` for ephemeral mode.
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

  // Always call both hooks to satisfy Rules of Hooks.
  // localStorage hook — active only when key is provided
  const [persistedValue, setPersistedValue] = useLocalStorage<ColumnState>(
    key ?? '__ephemeral__',
    defaultState,
  );

  // Ephemeral state — active only when no key is provided
  const [ephemeralState, setEphemeralState] = useState<ColumnState>(defaultState);

  const columnState = useMemo(() => {
    if (!isPersisted) {
      return ephemeralState;
    }
    if (!persistedValue) {
      return defaultState;
    }
    return migrateState(persistedValue, columns);
  }, [isPersisted, ephemeralState, persistedValue, columns, defaultState]);

  const setColumnState = useCallback(
    (state: ColumnState) => {
      if (isPersisted) {
        setPersistedValue(state);
      } else {
        setEphemeralState(state);
      }
    },
    [isPersisted, setPersistedValue],
  );

  return { columnState, setColumnState };
}
