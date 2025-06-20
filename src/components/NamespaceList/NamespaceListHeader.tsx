export const namespaceTableColumnClasses = {
  name: 'pf-m-width-40',
  applications: 'pf-m-width-40',
  kebab: 'pf-m-width-15 pf-c-table__action',
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
      title: ' ',
      props: { className: namespaceTableColumnClasses.kebab },
    },
  ];
};
