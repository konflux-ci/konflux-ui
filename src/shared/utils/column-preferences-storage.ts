import { FeatureFlagsStore } from '~/feature-flags/store';

export const COLUMN_PREFERENCES_STORAGE_FLAG = 'column-preferences-local-storage' as const;

type StorageKind = 'localStorage' | 'sessionStorage';

/** The storage selected for persisted column visibility/order preferences. */
export const getColumnPreferencesStorage = (): StorageKind =>
  FeatureFlagsStore.isOn(COLUMN_PREFERENCES_STORAGE_FLAG) ? 'localStorage' : 'sessionStorage';

const getStorage = (kind: StorageKind): Storage =>
  kind === 'localStorage' ? window.localStorage : window.sessionStorage;

/**
 * Moves a preference to the selected backend only when the selected backend has
 * no value. The old copy is removed after a successful move, preventing stale
 * data from being resurrected after a later backend toggle.
 */
export const migrateColumnPreferences = (key: string): void => {
  try {
    const selected = getColumnPreferencesStorage();
    const target = getStorage(selected);
    const source = getStorage(selected === 'localStorage' ? 'sessionStorage' : 'localStorage');
    if (target.getItem(key) === null) {
      const sourceValue = source.getItem(key);
      if (sourceValue !== null) {
        target.setItem(key, sourceValue);
        source.removeItem(key);
      }
    } else {
      // The selected value supersedes any old copy.
      source.removeItem(key);
    }
  } catch {
    // Storage can be unavailable (for example in privacy mode).
  }
};

/** Best-effort read for direct column-preference storage operations. */
export const readColumnPreference = (key: string): string | null => {
  try {
    migrateColumnPreferences(key);
    return getStorage(getColumnPreferencesStorage()).getItem(key);
  } catch {
    return null;
  }
};

/** Best-effort write for direct column-preference storage operations. */
export const writeColumnPreference = (key: string, value: string): void => {
  try {
    migrateColumnPreferences(key);
    const selected = getColumnPreferencesStorage();
    const target = getStorage(selected);
    target.setItem(key, value);
    getStorage(selected === 'localStorage' ? 'sessionStorage' : 'localStorage').removeItem(key);
  } catch {
    // Storage can be unavailable (for example in privacy mode).
  }
};

/** Removes a preference from both backends, including any legacy copy. */
export const removeColumnPreference = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable (for example in privacy mode).
  }
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be unavailable (for example in privacy mode).
  }
};
