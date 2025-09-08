import React from 'react';

export const useVisibleColumns = <T extends string>(
  storageKey: string,
  defaultColumns: Set<T>,
): [Set<T>, React.Dispatch<React.SetStateAction<Set<T>>>] => {
  const [visibleColumns, setVisibleColumns] = React.useState<Set<T>>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
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
      sessionStorage.setItem(storageKey, JSON.stringify([...visibleColumns]));
    } catch {
      // Silent error handling
    }
  }, [storageKey, visibleColumns]);

  return [visibleColumns, setVisibleColumns];
};
