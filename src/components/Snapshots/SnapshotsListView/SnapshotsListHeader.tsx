import { snapshotsTableColumnClasses } from '../../../consts/snapshots';
import { createTableHeaders } from '../../../shared/components/table/utils';

const snapshotColumns = [
  { title: 'Name', className: snapshotsTableColumnClasses.name, sortable: true },
  { title: 'Created at', className: snapshotsTableColumnClasses.createdAt, sortable: true },
  { title: 'Components', className: snapshotsTableColumnClasses.components },
  { title: 'Reference', className: snapshotsTableColumnClasses.reference },
  { title: '', className: snapshotsTableColumnClasses.kebab },
];

export default createTableHeaders(snapshotColumns);
