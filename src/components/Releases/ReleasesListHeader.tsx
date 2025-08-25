import { SortByDirection, ThProps } from '@patternfly/react-table';
import {
  generateDynamicColumnClasses,
  COMMON_COLUMN_CONFIGS,
} from '../../shared/components/table/dynamic-columns';
import { createTableHeaders } from '../../shared/components/table/utils';

type ReleaseColumnKeys =
  | 'name'
  | 'created'
  | 'duration'
  | 'status'
  | 'releasePlan'
  | 'releaseSnapshot'
  | 'tenantCollectorPipelineRun'
  | 'tenantPipelineRun'
  | 'managedPipelineRun'
  | 'finalPipelineRun';

export const getDynamicReleaseColumnClasses = (visibleColumns: Set<ReleaseColumnKeys>) => {
  return generateDynamicColumnClasses(visibleColumns, COMMON_COLUMN_CONFIGS, {
    specialClasses: { name: 'wrap-column' },
  });
};

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

// Create columns map with dynamic classes
const createAllColumnsMap = (visibleColumns?: Set<ReleaseColumnKeys>) => {
  const dynamicClasses = visibleColumns
    ? getDynamicReleaseColumnClasses(visibleColumns)
    : releasesTableColumnClasses;

  return {
    name: {
      title: 'Name',
      className: dynamicClasses.name || releasesTableColumnClasses.name,
      sortable: true,
    },
    created: {
      title: 'Created',
      className: dynamicClasses.created || releasesTableColumnClasses.created,
      sortable: true,
    },
    duration: {
      title: 'Duration',
      className: dynamicClasses.duration || releasesTableColumnClasses.duration,
    },
    status: {
      title: 'Status',
      className: dynamicClasses.status || releasesTableColumnClasses.status,
    },
    releasePlan: {
      title: 'Release Plan',
      className: dynamicClasses.releasePlan || releasesTableColumnClasses.releasePlan,
    },
    releaseSnapshot: {
      title: 'Release Snapshot',
      className: dynamicClasses.releaseSnapshot || releasesTableColumnClasses.releaseSnapshot,
    },
    tenantCollectorPipelineRun: {
      title: 'Tenant Collector',
      className:
        dynamicClasses.tenantCollectorPipelineRun ||
        releasesTableColumnClasses.tenantCollectorPipelineRun,
    },
    tenantPipelineRun: {
      title: 'Tenant Pipeline',
      className: dynamicClasses.tenantPipelineRun || releasesTableColumnClasses.tenantPipelineRun,
    },
    managedPipelineRun: {
      title: 'Managed Pipeline',
      className: dynamicClasses.managedPipelineRun || releasesTableColumnClasses.managedPipelineRun,
    },
    finalPipelineRun: {
      title: 'Final Pipeline',
      className: dynamicClasses.finalPipelineRun || releasesTableColumnClasses.finalPipelineRun,
    },
  } as Record<ReleaseColumnKeys, { title: string; className: string; sortable?: boolean }>;
};

const columnOrder: ReleaseColumnKeys[] = [
  'name',
  'created',
  'duration',
  'status',
  'releasePlan',
  'releaseSnapshot',
  'tenantCollectorPipelineRun',
  'tenantPipelineRun',
  'managedPipelineRun',
  'finalPipelineRun',
];

const getReleasesListHeaderWithColumns = (visibleColumns?: Set<ReleaseColumnKeys>) => {
  if (!visibleColumns) {
    return createTableHeaders(releaseColumns);
  }

  const allColumnsMap = createAllColumnsMap(visibleColumns);
  const dynamicClasses = getDynamicReleaseColumnClasses(visibleColumns);

  const visibleColumnHeaders = columnOrder
    .filter((columnKey) => visibleColumns.has(columnKey))
    .map((columnKey) => allColumnsMap[columnKey]);

  // Always add the kebab column at the end
  visibleColumnHeaders.push({ title: ' ', className: dynamicClasses.kebab });

  return createTableHeaders(visibleColumnHeaders);
};

const getReleasesListHeader = (
  activeSortIndex?: number,
  activeSortDirection?: SortByDirection,
  onSort?: ThProps['sort']['onSort'],
  visibleColumns?: Set<ReleaseColumnKeys>,
) => {
  const allColumnsMap = createAllColumnsMap(visibleColumns);
  const dynamicClasses = visibleColumns
    ? getDynamicReleaseColumnClasses(visibleColumns)
    : releasesTableColumnClasses;

  const columnsToUse = visibleColumns
    ? columnOrder
        .filter((columnKey) => visibleColumns.has(columnKey))
        .map((columnKey) => allColumnsMap[columnKey])
    : releaseColumns.slice(0, -1);

  const finalColumns = [...columnsToUse, { title: ' ', className: dynamicClasses.kebab }];

  return createTableHeaders(finalColumns)(activeSortIndex, activeSortDirection, onSort);
};

export { getReleasesListHeader, getReleasesListHeaderWithColumns };
export default createTableHeaders(releaseColumns);
