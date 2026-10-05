import React from 'react';
import { FeatureFlagsStore } from '~/feature-flags/store';
import {
  getColumnPreferencesStorage,
  migrateColumnPreferences,
} from '~/shared/utils/column-preferences-storage';

export const useVisibleColumns = <T extends string>(
  storageKey: string,
  defaultColumns: Set<T>,
): [Set<T>, React.Dispatch<React.SetStateAction<Set<T>>>] => {
  // Re-render when the flag changes so the preference backend is re-read.
  const storageType = React.useSyncExternalStore(
    FeatureFlagsStore.subscribe,
    getColumnPreferencesStorage,
    getColumnPreferencesStorage,
  );
  const previousStorageType = React.useRef(storageType);
  const skipWriteAfterStorageChange = React.useRef(false);
  const [visibleColumns, setVisibleColumns] = React.useState<Set<T>>(() => {
    try {
      migrateColumnPreferences(storageKey);
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      const saved = storage.getItem(storageKey);
      if (saved) {
        const parsedColumns = JSON.parse(saved) as T[];
        if (Array.isArray(parsedColumns)) return new Set(parsedColumns);
      }
    } catch {
      // Silent error handling
    }
    return defaultColumns;
  });

  React.useEffect(() => {
    const storageChanged = previousStorageType.current !== storageType;
    if (storageChanged) {
      previousStorageType.current = storageType;
      // The backend can change while this hook is mounted. Re-read after
      // migration before allowing the old in-memory value to be persisted.
      migrateColumnPreferences(storageKey);
      try {
        const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
        const saved = storage.getItem(storageKey);
        if (saved) {
          const parsedColumns = JSON.parse(saved) as T[];
          if (Array.isArray(parsedColumns)) {
            skipWriteAfterStorageChange.current = true;
            setVisibleColumns(new Set(parsedColumns));
            return;
          }
        }
      } catch {
        // Silent error handling
      }
      // Never persist the previous backend's in-memory value during the
      // switch. A subsequent render will persist a value selected by the user.
      return;
    }
    if (skipWriteAfterStorageChange.current) {
      skipWriteAfterStorageChange.current = false;
      return;
    }
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.setItem(storageKey, JSON.stringify([...visibleColumns]));
    } catch {
      // Silent error handling
    }
  }, [storageKey, storageType, visibleColumns]);

  return [visibleColumns, setVisibleColumns];
};
