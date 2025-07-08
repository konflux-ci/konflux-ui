import { useState, useEffect, useCallback } from 'react';
import { SnapshotColumnKey, defaultVisibleColumns } from './SnapshotsListHeader';

const STORAGE_KEY = 'konflux-snapshots-visible-columns';

export const useSnapshotsColumnManagement = () => {
  const [visibleColumns, setVisibleColumns] =
    useState<Set<SnapshotColumnKey>>(defaultVisibleColumns);
  const [isColumnManagementOpen, setIsColumnManagementOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedColumns = JSON.parse(stored);
        if (Array.isArray(storedColumns)) {
          // Ensure name and kebab columns are always visible
          const columnsSet = new Set(storedColumns as SnapshotColumnKey[]);
          columnsSet.add('name');
          columnsSet.add('kebab');
          setVisibleColumns(columnsSet);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load column visibility from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever visible columns change
  const handleVisibleColumnsChange = useCallback((newColumns: Set<SnapshotColumnKey>) => {
    // Ensure name and kebab columns are always visible
    const columnsWithRequired = new Set(newColumns);
    columnsWithRequired.add('name');
    columnsWithRequired.add('kebab');

    setVisibleColumns(columnsWithRequired);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(columnsWithRequired)));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save column visibility to localStorage:', error);
    }
  }, []);

  const openColumnManagement = useCallback(() => {
    setIsColumnManagementOpen(true);
  }, []);

  const closeColumnManagement = useCallback(() => {
    setIsColumnManagementOpen(false);
  }, []);

  const isColumnVisible = useCallback(
    (columnKey: SnapshotColumnKey) => {
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
