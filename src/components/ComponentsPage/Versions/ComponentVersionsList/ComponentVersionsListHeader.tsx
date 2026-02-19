export const componentVersionsListColumnClasses = {
  name: 'pf-m-width-20',
  description: 'pf-m-width-25',
  gitBranchOrTag: 'pf-m-width-25',
  pipeline: 'pf-m-width-20',
  actions: 'pf-v5-c-table__action',
};

const ComponentVersionsListHeader = () => [
  {
    title: 'Version name',
    props: { className: componentVersionsListColumnClasses.name },
  },
  {
    title: 'Description',
    props: { className: componentVersionsListColumnClasses.description },
  },
  {
    title: 'Git branch or tag',
    props: { className: componentVersionsListColumnClasses.gitBranchOrTag },
  },
  {
    title: 'Pipeline',
    props: { className: componentVersionsListColumnClasses.pipeline },
  },
  {
    title: ' ',
    props: { className: componentVersionsListColumnClasses.actions },
  },
];

export default ComponentVersionsListHeader;
