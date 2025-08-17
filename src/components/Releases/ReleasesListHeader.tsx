import { SortByDirection, ThProps } from '@patternfly/react-table';
import { createTableHeaders } from '../../shared/components/table/utils';

type ReleaseColumnKeys = 'name' | 'created' | 'duration' | 'status' | 'releasePlan' | 'releaseSnapshot' | 'tenantCollectorPipelineRun' | 'tenantPipelineRun' | 'managedPipelineRun' | 'finalPipelineRun';

export const releasesTableColumnClasses = {
  name: 'pf-m-width-20  pf-m-width-10-on-xl wrap-column',
  created: 'pf-m-width-20  pf-m-width-10-on-xl',
  duration: 'pf-m-width-20  pf-m-width-10-on-xl',
  status: 'pf-m-width-20  pf-m-width-10-on-xl',
  releasePlan: 'pf-m-width-20  pf-m-width-10-on-xl',
  releaseSnapshot: 'pf-m-hidden    pf-m-width-10-on-xl pf-m-visible-on-xl',
  tenantCollectorPipelineRun: 'pf-m-hidden    pf-m-width-10-on-xl pf-m-visible-on-xl',
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
  { title: 'Tenant Collector', className: releasesTableColumnClasses.tenantCollectorPipelineRun },
  { title: 'Tenant Pipeline', className: releasesTableColumnClasses.tenantPipelineRun },
  { title: 'Managed Pipeline', className: releasesTableColumnClasses.managedPipelineRun },
  { title: 'Final Pipeline', className: releasesTableColumnClasses.finalPipelineRun },
  { title: ' ', className: releasesTableColumnClasses.kebab },
];

const allColumnsMap: Record<ReleaseColumnKeys, { title: string; className: string; sortable?: boolean }> = {
  name: { title: 'Name', className: releasesTableColumnClasses.name, sortable: true },
  created: { title: 'Created', className: releasesTableColumnClasses.created, sortable: true },
  duration: { title: 'Duration', className: releasesTableColumnClasses.duration },
  status: { title: 'Status', className: releasesTableColumnClasses.status },
  releasePlan: { title: 'Release Plan', className: releasesTableColumnClasses.releasePlan },
  releaseSnapshot: { title: 'Release Snapshot', className: releasesTableColumnClasses.releaseSnapshot },
  tenantCollectorPipelineRun: { title: 'Tenant Collector', className: releasesTableColumnClasses.tenantCollectorPipelineRun },
  tenantPipelineRun: { title: 'Tenant Pipeline', className: releasesTableColumnClasses.tenantPipelineRun },
  managedPipelineRun: { title: 'Managed Pipeline', className: releasesTableColumnClasses.managedPipelineRun },
  finalPipelineRun: { title: 'Final Pipeline', className: releasesTableColumnClasses.finalPipelineRun },
};

const columnOrder: ReleaseColumnKeys[] = ['name', 'created', 'duration', 'status', 'releasePlan', 'releaseSnapshot', 'tenantCollectorPipelineRun', 'tenantPipelineRun', 'managedPipelineRun', 'finalPipelineRun'];

const getReleasesListHeaderWithColumns = (visibleColumns?: Set<ReleaseColumnKeys>) => {
  if (!visibleColumns) {
    return createTableHeaders(releaseColumns);
  }

  const visibleColumnHeaders = columnOrder
    .filter(columnKey => visibleColumns.has(columnKey))
    .map(columnKey => allColumnsMap[columnKey]);

  // Always add the kebab column at the end
  visibleColumnHeaders.push({ title: ' ', className: releasesTableColumnClasses.kebab });

  return createTableHeaders(visibleColumnHeaders);
};

const getReleasesListHeader = (activeSortIndex?: number, activeSortDirection?: SortByDirection, onSort?: ThProps['sort']['onSort'], visibleColumns?: Set<ReleaseColumnKeys>) => {
  const columnsToUse = visibleColumns ? 
    columnOrder
      .filter(columnKey => visibleColumns.has(columnKey))
      .map(columnKey => allColumnsMap[columnKey]) :
    releaseColumns.slice(0, -1);

  const finalColumns = [...columnsToUse, { title: ' ', className: releasesTableColumnClasses.kebab }];
  
  return createTableHeaders(finalColumns)(activeSortIndex, activeSortDirection, onSort);
};

export { getReleasesListHeader, getReleasesListHeaderWithColumns };
export default createTableHeaders(releaseColumns);
