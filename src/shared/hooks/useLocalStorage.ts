import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { FeatureFlagsStore } from '~/feature-flags/store';
import {
  getColumnPreferencesStorage,
  migrateColumnPreferences,
} from '../utils/column-preferences-storage';
import { createKeyedJSONStorage } from '../utils/storage';

type Listener = () => void;

const keyListeners = new Map<string, Set<Listener>>();

function notify(key: string) {
  keyListeners.get(key)?.forEach((l) => l());
}

const onStorage = (e: StorageEvent) => e.key && notify(e.key);

function subscribe(key: string, listener: Listener): () => void {
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  let set = keyListeners.get(key);
  if (!set) {
    set = new Set();
    keyListeners.set(key, set);
  }
  set.add(listener);

  return () => {
    set.delete(listener);
    if (set.size === 0) keyListeners.delete(key);

    if (keyListeners.size === 0) {
      window.removeEventListener('storage', onStorage);
    }
  };
}

/**
 * Reads and writes a JSON-serialised value in the selected browser storage for the given key.
 *
 * Backed by `useSyncExternalStore` so every component that shares the same key
 * stays in sync within the current tab. Cross-tab synchronization depends on the
 * selected storage backend and browser storage-event behavior.
 *
 * @param key           - storage key
 * @param initialValue  - fallback returned when the key does not exist
 * @param storageType   - storage backend used when `migrateFromSession` is false
 * @param migrateFromSession - use the column-preferences feature flag to select
 *                             the backend and migrate legacy session values
 * @returns `[value, setValue, removeValue]`
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue?: T,
  storageType: 'localStorage' | 'sessionStorage' = 'localStorage',
  migrateFromSession = false,
): [T | undefined, (value: T | ((prev: T) => T)) => void, () => void] => {
  const selectedStorageType = useSyncExternalStore(
    migrateFromSession ? FeatureFlagsStore.subscribe : () => () => undefined,
    migrateFromSession ? getColumnPreferencesStorage : () => storageType,
    migrateFromSession ? getColumnPreferencesStorage : () => storageType,
  );
  const storage = useMemo(() => {
    if (migrateFromSession && key !== '__ephemeral__') {
      migrateColumnPreferences(key);
    }
    return createKeyedJSONStorage<T>(key, selectedStorageType);
  }, [key, selectedStorageType, migrateFromSession]);

  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  const subscribeToStore = useCallback(
    (onStoreChange: () => void) => subscribe(key, onStoreChange),
    [key],
  );

  const getSnapshot = useCallback(() => storage.get(initialValueRef.current), [storage]);

  const value = useSyncExternalStore(subscribeToStore, getSnapshot);

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const prev = getSnapshot();
      const next = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      storage.set(next);
      notify(key);
    },
    [getSnapshot, key, storage],
  );

  const removeValue = useCallback(() => {
    storage.remove();
    notify(key);
  }, [storage, key]);

  return [value, setValue, removeValue];
};
