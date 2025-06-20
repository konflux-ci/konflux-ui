export const namespaceTableColumnClasses = {
  name: 'pf-m-width-35',
  applications: 'pf-m-width-30',
  actions: 'pf-m-width-35',
};

export const NamespaceListHeader = () => {
  return [
    {
      title: 'Name',
      props: { className: namespaceTableColumnClasses.name },
    },
    {
      title: 'Applications',
      props: { className: namespaceTableColumnClasses.applications },
    },
    {
      title: 'Actions',
      props: { className: namespaceTableColumnClasses.actions },
    },
  ];
};
