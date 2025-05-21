import { createTableHeaders } from '../../shared/components/table/utils';

export const releaseTableColumnClasses = {
  name: 'pf-m-width-20 ',
  status: 'pf-m-width-10',
  completionTime: 'pf-m-width-10',
  component: 'pf-m-width-20',
  application: 'pf-m-width-10',
  releasePlan: 'pf-m-width-20',
  namespace: 'pf-m-width-10 ',
};

export enum SortableHeaders {
  completionTime,
}

const releaseColumns = [
  { title: 'Release Name', className: releaseTableColumnClasses.name },
  { title: 'Status', className: releaseTableColumnClasses.status },
  { title: 'Completion Time', className: releaseTableColumnClasses.completionTime, sortable: true },
  { title: 'Component', className: releaseTableColumnClasses.component },
  { title: 'Application', className: releaseTableColumnClasses.application },
  { title: 'Release Plan', className: releaseTableColumnClasses.releasePlan },
  { title: 'Namespace', className: releaseTableColumnClasses.namespace },
];

export default createTableHeaders(releaseColumns);
