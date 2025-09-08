// Types for storage interfaces
type StringStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

type JSONStorage<Value> = {
  getItem(key: string, initialValue?: Value): Value;
  setItem(key: string, value: Value): void;
  removeItem(key: string): void;
};

export function createJSONStorage<Value>(
  getStringStorage: () => StringStorage | undefined = () => {
    try {
      return window.localStorage;
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.warn(e);
        }
      }
      return undefined;
    }
  },
): JSONStorage<Value> {
  let lastStr: string | undefined;
  let lastValue: Value;

  const storage: JSONStorage<Value> = {
    getItem: (key, initialValue) => {
      const parse = (str: string | null) => {
        const s = str || '';
        if (lastStr !== s) {
          try {
            lastValue = JSON.parse(s);
          } catch {
            return initialValue;
          }
          lastStr = s;
        }
        return lastValue;
      };
      const str = getStringStorage()?.getItem(key) ?? null;
      return parse(str);
    },
    setItem: (key, newValue) => getStringStorage()?.setItem(key, JSON.stringify(newValue)),
    removeItem: (key) => getStringStorage()?.removeItem(key),
  };

  return storage;
}

/**
 * Creates a simple JSON storage for a specific key and storage type
 * @param key - The storage key to use
 * @param storageType - The storage type ('localStorage' or 'sessionStorage')
 * @param options - Optional JSON serialization options
 */
export function createKeyedJSONStorage<Value>(
  key: string,
  storageType: 'localStorage' | 'sessionStorage' = 'localStorage',
) {
  const getStorage = (): StringStorage | undefined => {
    try {
      return storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.warn(`Failed to access ${storageType}:`, e);
        }
      }
      return undefined;
    }
  };

  const storage = createJSONStorage<Value>(getStorage);

  return {
    get: (initialValue?: Value): Value | undefined => {
      return storage.getItem(key, initialValue);
    },
    set: (value: Value): void => {
      storage.setItem(key, value);
    },
    remove: (): void => {
      storage.removeItem(key);
    },
  };
}
