import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { Td, Tr } from '@patternfly/react-table';
import { useRoleMap } from '~/hooks/useRole';
import ActionMenu from '../../shared/components/action-menu/ActionMenu';
import { rbTableColumnClasses } from './RBListHeader';
import { useRBActions } from './user-access-actions';
import { UserAccessTableRow } from './userAccessTableRows';

export function useUserAccessRowDisplay(obj: UserAccessTableRow) {
  const { roleBinding, subject } = obj;
  const actions = useRBActions(roleBinding);
  const [roleMap, loaded] = useRoleMap();

  return {
    username: subject?.name ?? '-',
    roleNode: !loaded ? (
      <Skeleton width="200px" height="20px" />
    ) : (
      roleMap?.roleMap[roleBinding.roleRef.name]
    ),
    bindingName: roleBinding.metadata.name,
    actionMenu: <ActionMenu actions={actions} />,
  };
}

export const RBListDataTds: React.FC<{ obj: UserAccessTableRow }> = ({ obj }) => {
  const { username, roleNode, bindingName, actionMenu } = useUserAccessRowDisplay(obj);
  return (
    <>
      <Td className={rbTableColumnClasses.username} dataLabel="Username">
        {username}
      </Td>
      <Td className={rbTableColumnClasses.role} dataLabel="Role">
        {roleNode}
      </Td>
      <Td className={rbTableColumnClasses.rolebinding} dataLabel="Role Binding">
        {bindingName}
      </Td>
      <Td className={`${rbTableColumnClasses.kebab} pf-v5-u-pr-0`} dataLabel="Actions">
        {actionMenu}
      </Td>
    </>
  );
};

export type UserAccessTableBodyRowProps = {
  obj: UserAccessTableRow;
  rowIndex: number;
  isSelected: boolean;
  onSelectRow: (rowKey: string, isSelected: boolean) => void;
};

export const UserAccessTableBodyRow: React.FC<UserAccessTableBodyRowProps> = ({
  obj,
  rowIndex,
  isSelected,
  onSelectRow,
}) => (
  <Tr>
    <Td
      dataLabel="Selected"
      select={{
        rowIndex,
        variant: 'checkbox',
        isSelected,
        onSelect: (_event, selected) => onSelectRow(obj.rowKey, selected),
      }}
    />
    <RBListDataTds obj={obj} />
  </Tr>
);
