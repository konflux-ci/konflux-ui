export const rbTableColumnClasses = {
  username: 'pf-m-width-25',
  role: 'pf-m-width-20',
  kebab: 'pf-v5-c-table__action',
};

export const RBListHeader = () => [
  {
    title: 'Username',
    props: { className: rbTableColumnClasses.username },
  },
  {
    title: 'Role',
    props: { className: rbTableColumnClasses.role },
  },
  {
    title: ' ',
    props: {
      className: rbTableColumnClasses.kebab,
    },
  },
];
