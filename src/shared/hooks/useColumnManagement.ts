import { useState, useEffect, useCallback } from 'react';

export interface UseColumnManagementOptions<T extends string> {
  defaultVisibleColumns: Set<T>;
  storageKey: string;
  requiredColumns?: T[];
}

export const useColumnManagement = <T extends string>({
  defaultVisibleColumns,
  storageKey,
  requiredColumns = [],
}: UseColumnManagementOptions<T>) => {
  const [visibleColumns, setVisibleColumns] = useState<Set<T>>(defaultVisibleColumns);
  const [isColumnManagementOpen, setIsColumnManagementOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storedColumns = JSON.parse(stored);
        if (Array.isArray(storedColumns)) {
          // Ensure required columns are always visible
          const columnsSet = new Set(storedColumns as T[]);
          requiredColumns.forEach((col) => columnsSet.add(col));
          setVisibleColumns(columnsSet);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load column visibility from localStorage:', error);
    }
  }, [storageKey, requiredColumns]);

  // Save to localStorage whenever visible columns change
  const handleVisibleColumnsChange = useCallback(
    (newColumns: Set<T>) => {
      // Ensure required columns are always visible
      const columnsWithRequired = new Set(newColumns);
      requiredColumns.forEach((col) => columnsWithRequired.add(col));

      setVisibleColumns(columnsWithRequired);

      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(columnsWithRequired)));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save column visibility to localStorage:', error);
      }
    },
    [storageKey, requiredColumns],
  );

  const openColumnManagement = useCallback(() => {
    setIsColumnManagementOpen(true);
  }, []);

  const closeColumnManagement = useCallback(() => {
    setIsColumnManagementOpen(false);
  }, []);

  const isColumnVisible = useCallback(
    (columnKey: T) => {
      return visibleColumns.has(columnKey);
    },
    [visibleColumns],
  );

  return {
    visibleColumns,
    isColumnManagementOpen,
    openColumnManagement,
    closeColumnManagement,
    handleVisibleColumnsChange,
    isColumnVisible,
  };
};
