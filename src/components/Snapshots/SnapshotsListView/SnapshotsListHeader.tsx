import { createTableHeaders } from '../../../shared/components/table/utils';

export const snapshotsTableColumnClasses = {
  name: 'pf-m-width-30',
  createdAt: 'pf-m-width-20',
  components: 'pf-m-width-20',
  reference: 'pf-m-width-25',
  kebab: 'pf-c-table__action',
};

export const snapshotColumns = [
  { title: 'Name', className: snapshotsTableColumnClasses.name, sortable: true },
  { title: 'Created at', className: snapshotsTableColumnClasses.createdAt, sortable: true },
  { title: 'Components', className: snapshotsTableColumnClasses.components },
  { title: 'Reference', className: snapshotsTableColumnClasses.reference },
  { title: '', className: snapshotsTableColumnClasses.kebab },
];
export const enum SortableSnapshotHeaders {
  name = 0,
  createdAt = 1,
  latestSuccessfulRelease = 2,
}

export default createTableHeaders(snapshotColumns);
