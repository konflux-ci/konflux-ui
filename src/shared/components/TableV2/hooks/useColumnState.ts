import { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { type ColumnDefinition, type ColumnState } from '../types';

// Only the `id` field is needed — use Pick to avoid variance issues with TData
type ColumnId = Pick<ColumnDefinition<never>, 'id'>;

function deriveDefaultState(columns: ColumnId[]): ColumnState {
  return {
    visibleColumns: columns.map((c) => c.id),
  };
}

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
