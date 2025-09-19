import { createTableHeaders } from '~/shared/components/table/utils';

export const releaseTableColumnClasses = {
  name: 'pf-m-width-20  pf-m-width-10-on-xl wrap-column',
  status: 'pf-m-width-20  pf-m-width-10-on-xl',
  completionTime: 'pf-m-width-20  pf-m-width-10-on-xl',
  component: 'pf-m-width-20  pf-m-width-10-on-xl',
  application: 'pf-m-width-20  pf-m-width-10-on-xl',
  releasePlan: 'pf-m-width-20  pf-m-width-10-on-xl',
  namespace: 'pf-m-width-20  pf-m-width-10-on-xl',
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

export default createTableHeaders(releaseColumns);
