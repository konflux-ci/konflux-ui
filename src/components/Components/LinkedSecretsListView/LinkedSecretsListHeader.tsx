import { createTableHeaders } from '../../../shared/components/table/utils';

export const linkedSecretsTableColumnClasses = {
  secretName: 'pf-m-width-25 wrap-column',
  type: 'pf-m-width-25',
  labels: 'pf-m-width-25 wrap-column',
  actions: 'pf-m-width-25',
};

export const enum SortableHeaders {
  secretName,
  type,
}

const linkedSecretsColumns = [
  {
    title: 'Secret name',
    className: linkedSecretsTableColumnClasses.secretName,
    sortable: true,
  },
  { title: 'Type', className: linkedSecretsTableColumnClasses.type, sortable: true },
  { title: 'Labels', className: linkedSecretsTableColumnClasses.labels },
  { title: 'Actions', className: linkedSecretsTableColumnClasses.actions },
];

export default createTableHeaders(linkedSecretsColumns);
