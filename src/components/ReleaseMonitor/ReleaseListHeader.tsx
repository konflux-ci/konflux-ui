import { pluralize, Text } from '@patternfly/react-core';
import { SortByDirection, ThProps } from '@patternfly/react-table';
import { ComponentProps } from '~/shared/components/table/Table';
import { createTableHeaders } from '~/shared/components/table/utils';

export const releaseTableColumnClasses = {
  name: 'pf-m-width-10  pf-m-width-10-on-xl wrap-column',
  status: 'pf-m-width-10  pf-m-width-10-on-xl',
  completionTime: 'pf-m-width-10  pf-m-width-10-on-xl',
  component: 'pf-m-width-10  pf-m-width-10-on-xl wrap-column',
  application: 'pf-m-width-10  pf-m-width-10-on-xl',
  releasePlan: 'pf-m-width-10  pf-m-width-10-on-xl wrap-column',
  namespace: 'pf-m-width-10  pf-m-width-10-on-xl',
  product: 'pf-m-width-10  pf-m-width-10-on-xl wrap-column',
  productVersion: 'pf-m-width-10  pf-m-width-10-on-xl',
  count: 'pf-m-width-2  pf-m-width-2-on-xl',
} as const;

export type ReleaseMonitorColumnKey = keyof typeof releaseTableColumnClasses;

export enum SortableHeaders {
  // Column indices must match the actual table column order
  name = 0,
  completionTime = 2,
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
  {
    title: 'Product',
    className: releaseTableColumnClasses.product,
  },
  {
    title: 'Product Version',
    className: releaseTableColumnClasses.productVersion,
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

    return [
      ...baseHeaders,
      ...(totalCount !== undefined
        ? [
            {
              title: (
                <Text component="small" className="pf-v5-u-font-weight-bold pf-v5-u-font-size-sm">
                  {pluralize(totalCount, 'release')}
                </Text>
              ),
              props: {
                className: `${releaseTableColumnClasses.count} pf-v5-u-text-align-center`,
              },
            },
          ]
        : []),
    ];
  };
};

export default createTableHeaders(releaseColumns);
