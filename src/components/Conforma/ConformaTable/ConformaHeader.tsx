import { createTableHeaders } from '~/shared/components/table/utils';

export const conformaTableColumnClasses = {
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
  { title: 'Rules', className: conformaTableColumnClasses.rules, sortable: true },
  { title: 'Status', className: conformaTableColumnClasses.status, sortable: true },
  { title: 'Message', className: conformaTableColumnClasses.message },
  { title: 'Component', className: conformaTableColumnClasses.component, sortable: true },
];

export default createTableHeaders(conformaColumns);
