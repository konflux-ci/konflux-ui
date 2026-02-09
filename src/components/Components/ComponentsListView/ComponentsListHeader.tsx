export const componentsTableColumnClasses = {
  component: 'pf-m-width-40 wrap-column',
  latestPushBuild: 'pf-m-width-40',
  kebab: 'pf-m-width-20 component-list-view__actions',
};

const ComponentsListHeader = () => {
  return [
    {
      title: 'Component',
      props: { className: componentsTableColumnClasses.component },
    },
    {
      title: 'Latest push build',
      props: { className: componentsTableColumnClasses.latestPushBuild },
    },
    {
      title: ' ',
      props: { className: componentsTableColumnClasses.kebab },
    },
  ];
};

export default ComponentsListHeader;
