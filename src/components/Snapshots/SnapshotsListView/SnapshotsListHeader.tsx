import { snapshotsTableColumnClasses } from '../../../consts/snapshots';
import { createTableHeaders } from '../../../shared/components/table/utils';
import { SnapshotColumnKey } from './types';

export const snapshotColumns = [
  { key: 'name', title: 'Name', className: snapshotsTableColumnClasses.name, sortable: true },
  {
    key: 'createdAt',
    title: 'Created at',
    className: snapshotsTableColumnClasses.createdAt,
    sortable: true,
  },
  { key: 'components', title: 'Components', className: snapshotsTableColumnClasses.components },
  { key: 'reference', title: 'Reference', className: snapshotsTableColumnClasses.reference },
  { key: 'kebab', title: '', className: snapshotsTableColumnClasses.kebab },
] as const;

export const defaultVisibleColumns: Set<SnapshotColumnKey> = new Set([
  'name',
  'createdAt',
  'components',
  'reference',
  'kebab',
]);

export const createSnapshotsListHeader = (
  visibleColumns: Set<SnapshotColumnKey> = defaultVisibleColumns,
) => {
  const filteredColumns = snapshotColumns.filter((column) => visibleColumns.has(column.key));
  return createTableHeaders(filteredColumns);
};

// Default header with all columns visible
const SnapshotsListHeader = createSnapshotsListHeader();

export default SnapshotsListHeader;
