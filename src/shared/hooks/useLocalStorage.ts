import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
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
 * Reads and writes a JSON-serialised value in `localStorage` for the given key.
 *
 * Backed by `useSyncExternalStore` so every component that shares the same key
 * stays in sync — both within the current tab and across tabs.
 *
 * @param key           - localStorage key
 * @param initialValue  - fallback returned when the key does not exist
 * @returns `[value, setValue, removeValue]`
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue?: T,
): [T | undefined, (value: T) => void, () => void] => {
  const storage = useMemo(() => createKeyedJSONStorage<T>(key), [key]);

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
