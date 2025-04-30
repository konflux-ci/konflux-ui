import { createTableHeaders } from '../../shared/components/table/utils';

export const applicationTableColumnClasses = {
  name: 'pf-m-width-35',
  components: 'pf-m-width-30',
  lastDeploy: 'pf-m-width-30',
  kebab: 'pf-v5-c-table__action',
};

export const enum SortableHeaders {
  name,
}

const appColumns = [
  { title: 'Name', className: applicationTableColumnClasses.name, sortable: true },
  { title: 'Components', className: applicationTableColumnClasses.components },
  { title: 'Last deploy', className: applicationTableColumnClasses.lastDeploy },
  { title: ' ', className: applicationTableColumnClasses.kebab },
];

export default createTableHeaders(appColumns);
