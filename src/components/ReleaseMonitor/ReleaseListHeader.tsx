import { SortByDirection, ThProps } from '@patternfly/react-table';
import { ComponentProps } from '~/shared/components/table/Table';
import { createTableHeaders } from '~/shared/components/table/utils';

export const releaseTableColumnClasses = {
  name: 'pf-m-width-20  pf-m-width-10-on-xl wrap-column',
  status: 'pf-m-width-20  pf-m-width-10-on-xl',
  completionTime: 'pf-m-width-20  pf-m-width-10-on-xl',
  component: 'pf-m-width-20  pf-m-width-10-on-xl',
  application: 'pf-m-width-20  pf-m-width-10-on-xl',
  releasePlan: 'pf-m-width-20  pf-m-width-10-on-xl',
  namespace: 'pf-m-width-20  pf-m-width-10-on-xl',
  count: 'pf-m-width-10  pf-m-width-5-on-xl',
} as const;

export type ReleaseMonitorColumnKey = keyof typeof releaseTableColumnClasses;

export enum SortableHeaders {
  name,
  completionTime,
}

const releaseColumns = [
  {
    title: 'Name',
    className: releaseTableColumnClasses.name,
    sortable: true,
  },
  {
    title: 'Status',
    className: releaseTableColumnClasses.status,
  },
  {
    title: 'Completion Time',
    className: releaseTableColumnClasses.completionTime,
    sortable: true,
  },
  {
    title: 'Component',
    className: releaseTableColumnClasses.component,
  },
  {
    title: 'Application',
    className: releaseTableColumnClasses.application,
  },
  {
    title: 'Release Plan',
    className: releaseTableColumnClasses.releasePlan,
  },
  {
    title: 'Namespace',
    className: releaseTableColumnClasses.namespace,
  },
] satisfies Parameters<typeof createTableHeaders>[0];

export const getReleasesListHeader = (
  activeSortIndex: number,
  activeSortDirection: SortByDirection,
  onSort: ThProps['sort']['onSort'],
  totalCount?: number,
) => {
  return (componentProps: ComponentProps) => {
    const baseHeaders = createTableHeaders(releaseColumns)(
      activeSortIndex,
      activeSortDirection,
      onSort,
    )(componentProps);

    if (totalCount !== undefined) {
      const countColumn = {
        title: (
          <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            {totalCount} {totalCount === 1 ? 'release' : 'releases'}
          </span>
        ),
        props: {
          className: releaseTableColumnClasses.count,
          style: { textAlign: 'center' as const },
        },
      };

      return [...baseHeaders, countColumn];
    }

    return baseHeaders;
  };
};

export default createTableHeaders(releaseColumns);
