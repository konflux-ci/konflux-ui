import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { createKeyedJSONStorage } from '~/shared/utils/storage';

type Listener = () => void;

const keyListeners = new Map<string, Set<Listener>>();

function notify(key: string) {
  keyListeners.get(key)?.forEach((listener) => listener());
}

const onStorage = (event: StorageEvent) => {
  if (!event.key || typeof window === 'undefined') return;

  try {
    if (event.storageArea === window.sessionStorage) notify(event.key);
  } catch {
    // Session storage may be unavailable in restricted browser contexts.
  }
};

function subscribe(key: string, listener: Listener): () => void {
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  let listeners = keyListeners.get(key);
  if (!listeners) {
    listeners = new Set();
    keyListeners.set(key, listeners);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) keyListeners.delete(key);

    if (keyListeners.size === 0) {
      window.removeEventListener('storage', onStorage);
    }
  };
}

/**
 * Reads and writes a JSON-serialised value in `sessionStorage` for the given key.
 *
 * Backed by `useSyncExternalStore` so components sharing the key stay in sync
 * within the current tab.
 *
 * @param key - sessionStorage key
 * @param initialValue - fallback returned when the key does not exist
 * @returns `[value, setValue, removeValue]`
 */
export const useSessionStorage = <T>(
  key: string,
  initialValue?: T,
): [T | undefined, (value: T | ((prev: T | undefined) => T)) => void, () => void] => {
  const storage = useMemo(() => createKeyedJSONStorage<T>(key, 'sessionStorage'), [key]);

  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  const subscribeToStore = useCallback(
    (onStoreChange: () => void) => subscribe(key, onStoreChange),
    [key],
  );

  const getSnapshot = useCallback(() => storage.get(initialValueRef.current), [storage]);

  const setValue = useCallback(
    (newValue: T | ((prev: T | undefined) => T)) => {
      const previousValue = getSnapshot();
      const nextValue =
        typeof newValue === 'function'
          ? (newValue as (prev: T | undefined) => T)(previousValue)
          : newValue;
      storage.set(nextValue);
      notify(key);
    },
    [getSnapshot, key, storage],
  );

  const removeValue = useCallback(() => {
    storage.remove();
    notify(key);
  }, [key, storage]);

  return [useSyncExternalStore(subscribeToStore, getSnapshot), setValue, removeValue];
};
