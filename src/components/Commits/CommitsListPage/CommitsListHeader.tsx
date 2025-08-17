export const commitsTableColumnClasses = {
  name: 'pf-m-width-35 wrap-column',
  branch: 'pf-m-width-20 pf-m-width-10-on-lg commits-list__branch',
  component: 'pf-m-width-35 pf-m-width-25-on-lg pf-m-width-15-on-xl',
  byUser: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  committedAt: 'pf-m-hidden pf-m-visible-on-lg pf-m-width-20 pf-m-width-10-on-xl',
  status: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-10',
  kebab: 'pf-v5-c-table__action',
};

type CommitColumnKeys = 'name' | 'branch' | 'component' | 'byUser' | 'committedAt' | 'status';

interface CommitsListHeaderProps {
  visibleColumns: Set<CommitColumnKeys>;
}

const CommitsListHeader = ({ visibleColumns }: CommitsListHeaderProps) => {
  const allColumns = [
    {
      key: 'name',
      title: 'Name',
      props: { className: commitsTableColumnClasses.name },
    },
    {
      key: 'branch',
      title: 'Branch',
      props: { className: commitsTableColumnClasses.branch },
    },
    {
      key: 'component',
      title: 'Component',
      props: { className: commitsTableColumnClasses.component },
    },
    {
      key: 'byUser',
      title: 'By user',
      props: { className: commitsTableColumnClasses.byUser },
    },
    {
      key: 'committedAt',
      title: 'Latest commit at',
      props: { className: commitsTableColumnClasses.committedAt },
    },
    {
      key: 'status',
      title: 'Status',
      props: { className: commitsTableColumnClasses.status },
    },
  ];

  const visibleColumnsWithActions = [...allColumns.filter(column => visibleColumns.has(column.key as CommitColumnKeys)), {
    title: ' ',
    props: { className: commitsTableColumnClasses.kebab },
  }];

  return visibleColumnsWithActions;
};

export default CommitsListHeader;
