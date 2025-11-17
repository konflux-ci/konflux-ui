import { createTableHeaders } from '../../../shared/components/table/utils';

export const issuesTableColumnClasses = {
  issue: 'pf-m-width-20 wrap-column',
  scope: 'pf-m-width-10',
  severity: 'pf-m-width-10',
  status: 'pf-m-width-10',
  createdOn: 'pf-m-width-15',
  description: 'pf-m-width-20',
  usefulLinks: 'pf-m-width-10',
  kebab: 'pf-m-width-5 issues-list-view__actions',
};

export const IssuesListHeader = [
  {
    title: 'Issue name',
    className: issuesTableColumnClasses.issue,
    sortable: true,
  },
  {
    title: 'Scope',
    className: issuesTableColumnClasses.scope,
    sortable: true,
  },
  {
    title: 'Severity',
    className: issuesTableColumnClasses.severity,
    sortable: true,
  },
  {
    title: 'Status',
    className: issuesTableColumnClasses.status,
    sortable: true,
  },
  {
    title: 'Created on',
    className: issuesTableColumnClasses.createdOn,
    sortable: true,
  },
  {
    title: 'Description',
    className: issuesTableColumnClasses.description,
    sortable: true,
  },
  {
    title: 'Useful links',
    className: issuesTableColumnClasses.usefulLinks,
  },
  {
    title: ' ',
    className: issuesTableColumnClasses.kebab,
  },
];

export const enum SortableIssuesHeaders {
  title = 0,
  scope = 1,
  severity = 2,
  status = 3,
  createdAt = 4,
  description = 5,
}

export const IssuesTableHeader = createTableHeaders(IssuesListHeader);
