import React from 'react';

export const useVisibleColumns = <T extends string>(
  storageKey: string,
  defaultColumns: Set<T>,
): [Set<T>, React.Dispatch<React.SetStateAction<Set<T>>>] => {
  const [visibleColumns, setVisibleColumns] = React.useState<Set<T>>(() => {
    try {
      let saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        // Preserve column choices made before preferences moved to localStorage.
        saved = window.sessionStorage.getItem(storageKey);
        if (saved) {
          window.localStorage.setItem(storageKey, saved);
          window.sessionStorage.removeItem(storageKey);
        }
      }
      if (saved) {
        const parsedColumns = JSON.parse(saved) as T[];
        if (Array.isArray(parsedColumns)) {
          return new Set(parsedColumns);
        }
      }
    } catch {
      // Silent error handling
    }
    return defaultColumns;
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...visibleColumns]));
    } catch {
      // Silent error handling
    }
  }, [storageKey, visibleColumns]);

  return [visibleColumns, setVisibleColumns];
};
