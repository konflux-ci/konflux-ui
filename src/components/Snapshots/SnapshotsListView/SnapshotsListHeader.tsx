import { createTableHeaders } from '../../../shared/components/table/utils';

export const snapshotsTableColumnClasses = {
  name: 'pf-m-width-25',
  createdAt: 'pf-m-width-15',
  components: 'pf-m-width-15',
  trigger: 'pf-m-width-10',
  reference: 'pf-m-width-20',
  latestSuccessfulRelease: 'pf-m-width-10',
  kebab: 'pf-c-table__action',
};

export type SnapshotColumnKey = keyof typeof snapshotsTableColumnClasses;

export const snapshotColumns = [
  { key: 'name', title: 'Name', className: snapshotsTableColumnClasses.name, sortable: true },
  {
    key: 'createdAt',
    title: 'Created at',
    className: snapshotsTableColumnClasses.createdAt,
    sortable: true,
  },
  { key: 'components', title: 'Components', className: snapshotsTableColumnClasses.components },
  { key: 'trigger', title: 'Trigger', className: snapshotsTableColumnClasses.trigger },
  { key: 'reference', title: 'Reference', className: snapshotsTableColumnClasses.reference },
  {
    key: 'latestSuccessfulRelease',
    title: 'Last successful release',
    className: snapshotsTableColumnClasses.latestSuccessfulRelease,
    sortable: true,
  },
  { key: 'kebab', title: '', className: snapshotsTableColumnClasses.kebab },
] as const;

export const defaultVisibleColumns: Set<SnapshotColumnKey> = new Set([
  'name',
  'createdAt',
  'components',
  'trigger',
  'reference',
  'latestSuccessfulRelease',
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
