export const issuesTableColumnClasses = {
  issue: 'pf-m-width-20 wrap-column',
  scope: 'pf-m-width-15',
  severity: 'pf-m-width-10',
  status: 'pf-m-width-10',
  createdAt: 'pf-m-width-15',
  reason: 'pf-m-width-20',
  usefulLinks: 'pf-m-width-10',
  kebab: 'pf-m-width-10 issues-list-view__actions',
};

const IssuesListHeader = () => {
  return [
    {
      title: 'Issue name',
      props: { className: issuesTableColumnClasses.issue },
    },
    {
      title: 'Scope',
      props: { className: issuesTableColumnClasses.scope },
    },
    {
      title: 'Severity',
      props: { className: issuesTableColumnClasses.severity },
    },
    {
      title: 'Status',
      props: { className: issuesTableColumnClasses.status },
    },
    {
      title: 'Created at',
      props: { className: issuesTableColumnClasses.createdAt },
    },
    {
      title: 'Reason',
      props: { className: issuesTableColumnClasses.reason },
    },
    {
      title: 'Useful links',
      props: { className: issuesTableColumnClasses.usefulLinks },
    },
    {
      title: ' ',
      props: { className: issuesTableColumnClasses.kebab },
    },
  ];
};

export default IssuesListHeader;
