// The 'components' is just one number while the 'keytab'
// is just two or three words, so let them be shorter.
export const secretsTableColumnClasses = {
  secretType: 'pf-m-width-20',
  name: 'pf-m-width-25 wrap-column',
  components: 'pf-m-width-15',
  status: 'pf-m-width-15',
  labels: 'pf-m-width-20 wrap-column',
  kebab: 'pf-m-width-5 pf-c-table__action',
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
      title: 'Status',
      props: { className: secretsTableColumnClasses.status },
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
