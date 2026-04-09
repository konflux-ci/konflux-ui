import * as React from 'react';
import { Th, Tr } from '@patternfly/react-table';

export const rbTableColumnClasses = {
  username: 'pf-m-width-25',
  role: 'pf-m-width-20',
  rolebinding: 'pf-m-width-40 wrap-column',
  kebab: 'pf-v5-c-table__action',
};

const usernameColumnInfoPopover =
  'Each row is one subject (user, group, or service account) from the role binding. Bindings with multiple subjects appear as multiple rows. Displays "-" when the binding has no subjects.';

const roleBindingColumnInfoPopover =
  'A Role Binding grants the permissions defined in a role to a user or set of users. It holds a list of subjects (users, groups, or service accounts) and a reference to the role being granted.';

export type UserAccessTableHeaderSelectProps = {
  isAllSelected: boolean;
  isDisabled: boolean;
  onSelectAll: (event: React.FormEvent<HTMLInputElement>, isSelecting: boolean) => void;
};

export type UserAccessTableHeaderRowProps = {
  headerSelect: UserAccessTableHeaderSelectProps;
};

export const UserAccessTableHeaderRow: React.FC<UserAccessTableHeaderRowProps> = ({
  headerSelect,
}) => (
  <Tr>
    <Th
      aria-label="Select all rows"
      select={{
        onSelect: headerSelect.onSelectAll,
        isSelected: headerSelect.isAllSelected,
        isHeaderSelectDisabled: headerSelect.isDisabled,
      }}
    />
    <Th
      className={rbTableColumnClasses.username}
      modifier="nowrap"
      info={{ popover: usernameColumnInfoPopover }}
    >
      Username
    </Th>
    <Th className={rbTableColumnClasses.role} modifier="nowrap">
      Role
    </Th>
    <Th
      className={rbTableColumnClasses.rolebinding}
      modifier="nowrap"
      info={{ popover: roleBindingColumnInfoPopover }}
    >
      Role Binding
    </Th>
    <Th className={rbTableColumnClasses.kebab} screenReaderText="Row actions" />
  </Tr>
);

// export const RBListHeader = () => [
//   {
//     title: <>Username </>,
//     props: {
//       className: rbTableColumnClasses.username,
//       info: {
//         popover: usernameColumnInfoPopover,
//       },
//     },
//   },
//   {
//     title: 'Role',
//     props: { className: rbTableColumnClasses.role },
//   },
//   {
//     title: <>Role Binding </>,
//     props: {
//       className: rbTableColumnClasses.rolebinding,
//       info: {
//         popover: roleBindingColumnInfoPopover,
//       },
//     },
//   },
//   {
//     title: ' ',
//     props: {
//       className: rbTableColumnClasses.kebab,
//     },
//   },
// ];
