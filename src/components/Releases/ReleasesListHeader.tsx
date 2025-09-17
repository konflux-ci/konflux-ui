import { SortByDirection, ThProps } from '@patternfly/react-table';
import {
  ReleaseColumnKeys,
  RELEASE_COLUMNS_DEFINITIONS,
  RELEASE_COLUMN_ORDER,
} from '../../consts/release';
import {
  generateDynamicColumnClasses,
  COMMON_COLUMN_CONFIGS,
} from '../../shared/components/table/dynamic-columns';
import { createTableHeaders } from '../../shared/components/table/utils';

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

const releaseColumns = RELEASE_COLUMNS_DEFINITIONS.map((col) => ({
  title: col.title,
  className: releasesTableColumnClasses[col.key],
  sortable: col.sortable,
})).concat([{ title: ' ', className: releasesTableColumnClasses.kebab, sortable: false }]);

// Create columns map with dynamic classes
const createAllColumnsMap = (visibleColumns?: Set<ReleaseColumnKeys>) => {
  const dynamicClasses = visibleColumns
    ? getDynamicReleaseColumnClasses(visibleColumns)
    : releasesTableColumnClasses;

  return RELEASE_COLUMNS_DEFINITIONS.reduce(
    (acc, col) => {
      acc[col.key] = {
        title: col.title,
        className: dynamicClasses[col.key] || releasesTableColumnClasses[col.key],
        sortable: col.sortable,
      };
      return acc;
    },
    {} as Record<ReleaseColumnKeys, { title: string; className: string; sortable?: boolean }>,
  );
};

const columnOrder: ReleaseColumnKeys[] = RELEASE_COLUMN_ORDER as ReleaseColumnKeys[];

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
