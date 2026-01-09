import { pluralize, Text } from '@patternfly/react-core';
import { SortByDirection, ThProps } from '@patternfly/react-table';
import HelpPopover from '~/components/HelpPopover';
import { ComponentProps } from '~/shared/components/table/Table';
import { createTableHeaders } from '~/shared/components/table/utils';

export const releaseTableColumnClasses = {
  name: 'pf-m-width-20  pf-m-width-10-on-xl wrap-column',
  status: 'pf-m-width-20  pf-m-width-10-on-xl',
  completionTime: 'pf-m-width-20  pf-m-width-10-on-xl',
  component: 'pf-m-width-20  pf-m-width-10-on-xl',
  application: 'pf-m-width-20  pf-m-width-10-on-xl',
  releasePlan: 'pf-m-width-20  pf-m-width-10-on-xl',
  product: 'pf-m-width-20  pf-m-width-10-on-xl',
  productVersion: 'pf-m-width-20  pf-m-width-10-on-xl',
  namespace: 'pf-m-width-20  pf-m-width-10-on-xl',
  count: 'pf-m-width-10  pf-m-width-5-on-xl',
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
    title: (
      <>
        Product{' '}
        <HelpPopover
          headerContent="Product information"
          bodyContent="If you can't see the values 'Product', it means you don't own the permission to access the release engineering tenant namespace"
        />
      </>
    ),
    className: releaseTableColumnClasses.product,
  },
  {
    title: (
      <>
        Product Version{' '}
        <HelpPopover
          headerContent="Product Version information"
          bodyContent="If you can't see the values 'Product Version', it means you don't own the permission to access the release engineering tenant namespace"
        />
      </>
    ),
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
