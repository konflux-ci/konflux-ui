export const issuesExpandedTableColumnClasses = {
  issue: 'pf-m-width-20 wrap-column',
  severity: 'pf-m-width-10',
  status: 'pf-m-width-10',
  createdOn: 'pf-m-width-15',
  reason: 'pf-m-width-20',
  usefulLinks: 'pf-m-width-10',
  kebab: 'pf-m-width-10 issues-list-view__actions',
};

const IssuesListExpandedHeader = () => {
  return [
    {
      title: 'Resource impacted',
      props: { className: issuesExpandedTableColumnClasses.issue },
    },
    {
      title: 'Severity',
      props: { className: issuesExpandedTableColumnClasses.severity },
    },
    {
      title: 'Status',
      props: { className: issuesExpandedTableColumnClasses.status },
    },
    {
      title: 'Created on',
      props: { className: issuesExpandedTableColumnClasses.createdOn },
    },
    {
      title: 'Reason',
      props: { className: issuesExpandedTableColumnClasses.reason },
    },
    {
      title: 'Useful links',
      props: { className: issuesExpandedTableColumnClasses.usefulLinks },
    },
    {
      title: ' ',
      props: { className: issuesExpandedTableColumnClasses.kebab },
    },
  ];
};

export default IssuesListExpandedHeader;
