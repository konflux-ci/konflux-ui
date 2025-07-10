import { useColumnManagement } from '../../../shared/hooks/useColumnManagement';
import { defaultVisibleColumns } from './SnapshotsListHeader';
import { SnapshotColumnKey } from './types';

const STORAGE_KEY = 'konflux-snapshots-visible-columns';
const REQUIRED_COLUMNS: SnapshotColumnKey[] = ['name', 'kebab'];

export const useSnapshotsColumnManagement = () => {
  return useColumnManagement<SnapshotColumnKey>({
    defaultVisibleColumns,
    storageKey: STORAGE_KEY,
    requiredColumns: REQUIRED_COLUMNS,
  });
};
