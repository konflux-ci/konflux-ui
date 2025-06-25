export const namespaceTableColumnClasses = {
  name: 'pf-m-width-50',
  applications: 'pf-m-width-50',
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
  ];
};
