import { createTableHeaders } from '~/shared/components/table/utils';

export const ConformaTableColumnClasses = {
  rules: 'pf-m-width-30 wrap-column',
  status: 'pf-m-width-10',
  message: 'pf-m-width-30 wrap-column',
  component: 'pf-m-width-25',
};

export const enum SortableConformaHeaders {
  title,
  component,
  status,
}

const conformaColumns = [
  { title: 'Rules', className: ConformaTableColumnClasses.rules, sortable: true },
  { title: 'Status', className: ConformaTableColumnClasses.status, sortable: true },
  { title: 'Message', className: ConformaTableColumnClasses.message },
  { title: 'Component', className: ConformaTableColumnClasses.component, sortable: true },
];

export default createTableHeaders(conformaColumns);
