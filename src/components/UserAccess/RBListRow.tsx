import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { useRoleMap } from '../../hooks/useRole';
import { RowFunctionArgs, TableData } from '../../shared';
import ActionMenu from '../../shared/components/action-menu/ActionMenu';
import { RoleBinding } from '../../types';
import { rbTableColumnClasses } from './RBListHeader';
import { useRBActions } from './user-access-actions';

export const RBListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<RoleBinding>>> = ({
  obj,
}) => {
  const actions = useRBActions(obj);
  const [roleMap, roleMapLoading] = useRoleMap();

  const columns = [
    { className: rbTableColumnClasses.username, content: obj.subjects[0]?.name },
    { className: rbTableColumnClasses.role, content: roleMap[obj.roleRef.name] },
    {
      className: rbTableColumnClasses.kebab,
      content: <ActionMenu actions={actions} />,
    },
  ];

  // Before we get the roleMap, the role tab would be shown as loading.
  const renderColumn = (column: { className: string; content: React.ReactNode }) => {
    return (
      <TableData className={column.className}>
        {roleMapLoading && column.className === rbTableColumnClasses.role ? (
          <Skeleton />
        ) : (
          column.content
        )}
      </TableData>
    );
  };

  return <>{columns.map(renderColumn)}</>;
};
