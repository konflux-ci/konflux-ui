import { createTableHeaders } from '../../shared/components/table/utils';

export const releaseTableColumnClasses = {
  name: 'pf-m-width-20 ',
  status: 'pf-m-width-20',
  completionTime: 'pf-m-width-20',
  component: 'pf-m-width-20',
  application: 'pf-m-width-20',
  releasePlan: 'pf-m-width-20',
  namespace: 'pf-m-width-20 ',
};

export const applicationTableColumnClasses = {
  name: 'pf-m-width-35',
  components: 'pf-m-width-30',
  lastDeploy: 'pf-m-width-30',
  kebab: 'pf-v5-c-table__action',
};

export const enum SortableHeaders {
  name,
  created,
}

const releaseColumns = [
  { title: 'Release Name', className: releaseTableColumnClasses.name },
  { title: 'Status', className: releaseTableColumnClasses.status },
  { title: 'Completion Time', className: releaseTableColumnClasses.completionTime },
  { title: 'Component', className: releaseTableColumnClasses.component },
  { title: 'Application', className: releaseTableColumnClasses.application },
  { title: 'Release Plan', className: releaseTableColumnClasses.releasePlan },
  { title: 'Namespace', className: releaseTableColumnClasses.namespace },
];

export default createTableHeaders(releaseColumns);
