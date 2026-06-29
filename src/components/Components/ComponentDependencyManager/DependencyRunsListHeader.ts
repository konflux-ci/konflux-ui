export const dependencyRunTableColumnClasses = {
  name: 'pf-m-width-35 dependency-runs-list__name',
  started: 'pf-m-width-20 dependency-runs-list__started',
  duration: 'pf-m-width-15 dependency-runs-list__duration',
  status: 'pf-m-width-10 dependency-runs-list__status',
};

export const dependencyRunsListHeader = () => [
  {
    title: 'Name',
    props: { className: dependencyRunTableColumnClasses.name },
  },
  {
    title: 'Started',
    props: { className: dependencyRunTableColumnClasses.started },
  },
  {
    title: 'Duration',
    props: { className: dependencyRunTableColumnClasses.duration },
  },
  {
    title: 'Status',
    props: { className: dependencyRunTableColumnClasses.status },
  },
];
