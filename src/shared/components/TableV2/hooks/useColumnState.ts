import { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { type ColumnDefinition, type ColumnState } from '../types';

// Only the `id` field is needed — use Pick to avoid variance issues with TData
type ColumnId = Pick<ColumnDefinition<never>, 'id'>;

/** Derives the default column state from column definitions (all columns visible, no sort). */
function deriveDefaultState(columns: ColumnId[]): ColumnState {
  return {
    visibleColumns: columns.map((c) => c.id),
  };
}

/**
 * Migrates a persisted column state against the current column definitions.
 *
 * Handles schema drift: removes IDs for columns that no longer exist,
 * appends new columns that were added since the state was persisted,
 * and clears the sort if the sorted column was removed.
 */
function migrateState(persisted: ColumnState, columns: ColumnId[]): ColumnState {
  const validIds = new Set(columns.map((c) => c.id));

  // Remove stale column IDs, preserving persisted order
  const existing = persisted.visibleColumns.filter((id) => validIds.has(id));

  // Append new column IDs not present in persisted state
  const existingSet = new Set(existing);
  const added = columns.filter((c) => !existingSet.has(c.id)).map((c) => c.id);

  const visibleColumns = [...existing, ...added];

  // Clear sort if the sorted column no longer exists
  const sortColumn =
    persisted.sortColumn && validIds.has(persisted.sortColumn) ? persisted.sortColumn : undefined;
  const sortDirection = sortColumn ? persisted.sortDirection : undefined;

  return { visibleColumns, sortColumn, sortDirection };
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
