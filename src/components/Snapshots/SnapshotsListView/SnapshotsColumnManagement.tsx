import React from 'react';
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { SnapshotColumnKey, snapshotColumns, defaultVisibleColumns } from './SnapshotsListHeader';

const NON_HIDABLE_COLUMNS: SnapshotColumnKey[] = ['name', 'kebab'];

type SnapshotsColumnManagementProps = {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Set<SnapshotColumnKey>;
  onVisibleColumnsChange: (columns: Set<SnapshotColumnKey>) => void;
};

const SnapshotsColumnManagement: React.FC<SnapshotsColumnManagementProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onVisibleColumnsChange,
}) => {
  return (
    <ColumnManagement
      isOpen={isOpen}
      onClose={onClose}
      visibleColumns={visibleColumns}
      onVisibleColumnsChange={onVisibleColumnsChange}
      columns={snapshotColumns}
      defaultVisibleColumns={defaultVisibleColumns}
      nonHidableColumns={NON_HIDABLE_COLUMNS}
      title="Manage columns"
      description="Selected columns will be displayed in the table."
    />
  );
};

export default SnapshotsColumnManagement;
