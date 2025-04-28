import { createTableHeaders } from '../../shared/components/table/utils';

export const releasesTableColumnClasses = {
  name: 'pf-m-width-20  pf-m-width-10-on-xl wrap-column',
  created: 'pf-m-width-20  pf-m-width-15-on-xl',
  duration: 'pf-m-width-20  pf-m-width-15-on-xl',
  status: 'pf-m-width-20  pf-m-width-10-on-xl',
  releasePlan: 'pf-m-width-20  pf-m-width-10-on-xl',
  releaseSnapshot: 'pf-m-hidden    pf-m-width-10-on-xl pf-m-visible-on-xl',
  managedPipelineRun: 'pf-m-hidden    pf-m-width-10-on-xl pf-m-visible-on-xl',
  tenantPipelineRun: 'pf-m-hidden    pf-m-width-10-on-xl pf-m-visible-on-xl',
  finalPipelineRun: 'pf-m-hidden    pf-m-width-10-on-xl pf-m-visible-on-xl',
  kebab: 'pf-v5-c-table__action',
};

export const enum SortableHeaders {
  name,
  created,
}

const releaseColumns = [
  { title: 'Name', className: releasesTableColumnClasses.name, sortable: true },
  { title: 'Created', className: releasesTableColumnClasses.created, sortable: true },
  { title: 'Duration', className: releasesTableColumnClasses.duration },
  { title: 'Status', className: releasesTableColumnClasses.status },
  { title: 'Release Plan', className: releasesTableColumnClasses.releasePlan },
  { title: 'Release Snapshot', className: releasesTableColumnClasses.releaseSnapshot },
  { title: 'Tenant Pipeline', className: releasesTableColumnClasses.tenantPipelineRun },
  { title: 'Managed Pipeline', className: releasesTableColumnClasses.managedPipelineRun },
  { title: 'Final Pipeline', className: releasesTableColumnClasses.finalPipelineRun },
  { title: ' ', className: releasesTableColumnClasses.kebab },
];

export default createTableHeaders(releaseColumns);
