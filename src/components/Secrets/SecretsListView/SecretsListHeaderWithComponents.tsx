// The 'components' is just one number while the 'keytab'
// is just two or three words, so let them be shorter.
export const secretsTableColumnClasses = {
  secretType: 'pf-m-width-25',
  name: 'pf-m-width-25 wrap-column',
  components: 'pf-m-width-15',
  labels: 'pf-m-width-25 wrap-column',
  kebab: 'pf-c-table__action', // pf-m-width-15
};

const SecretsListHeaderWithComponents = () => {
  return [
    {
      title: 'Secret type',
      props: { className: secretsTableColumnClasses.secretType },
    },
    {
      title: 'Name',
      props: { className: secretsTableColumnClasses.name },
    },
    {
      title: 'Components',
      props: { className: secretsTableColumnClasses.components },
    },
    {
      title: 'Labels',
      props: { className: secretsTableColumnClasses.labels },
    },
    {
      title: ' ',
      props: { className: secretsTableColumnClasses.kebab },
    },
  ];
};

export default SecretsListHeaderWithComponents;
