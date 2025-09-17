export const rbTableColumnClasses = {
  username: 'pf-m-width-25',
  role: 'pf-m-width-20',
  rolebinding: 'pf-m-width-20 wrap-column',
  kebab: 'pf-v5-c-table__action',
};

export const RBListHeader = () => [
  {
    title: <>Username </>,
    props: {
      className: rbTableColumnClasses.username,
      info: {
        popover:
          'The primary user or service account from the role binding. Shows the first subject after sanitization for Kubernetes compatibility. Displays "-" when no subjects are defined.',
      },
    },
  },
  {
    title: 'Role',
    props: { className: rbTableColumnClasses.role },
  },
  {
    title: <>Role Binding </>,
    props: {
      className: rbTableColumnClasses.rolebinding,
      info: {
        popover:
          'A Role Binding grants the permissions defined in a role to a user or set of users. It holds a list of subjects (users, groups, or service accounts) and a reference to the role being granted.',
      },
    },
  },
  {
    title: ' ',
    props: {
      className: rbTableColumnClasses.kebab,
    },
  },
];
