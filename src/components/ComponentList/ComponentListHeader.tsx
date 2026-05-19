export const componentsTableColumnClasses = {
  component: 'pf-m-width-30 wrap-column',
  gitRepository: 'pf-m-width-30 wrap-column',
  imageRegistry: 'pf-m-width-30 wrap-column',
  componentVersions: 'pf-m-width-20',
};

const ComponentsListHeader = () => {
  return [
    {
      title: 'Name',
      props: { className: componentsTableColumnClasses.component },
    },
    {
      title: 'Git Repository',
      props: { className: componentsTableColumnClasses.gitRepository },
    },
    {
      title: 'Image Registry',
      props: { className: componentsTableColumnClasses.imageRegistry },
    },
    {
      title: 'Component Versions',
      props: { className: componentsTableColumnClasses.componentVersions },
    },
  ];
};

export default ComponentsListHeader;
