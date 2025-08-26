import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { useRoleMap } from '../../hooks/useRole';
import { RowFunctionArgs, TableData } from '../../shared';
import ActionMenu from '../../shared/components/action-menu/ActionMenu';
import { RoleBinding } from '../../types';
import { rbTableColumnClasses } from './RBListHeader';
import { useRBActions } from './user-access-actions';

export const RBListRow: React.FC<
  React.PropsWithChildren<
    RowFunctionArgs<{ roleBinding: RoleBinding; subject: RoleBinding['subjects'][0] | null }>
  >
> = ({ obj }) => {
  const actions = useRBActions(obj.roleBinding);
  const [roleMap, loaded] = useRoleMap();

  return (
    <>
      <TableData className={rbTableColumnClasses.username}>{obj.subject?.name || '-'}</TableData>
      <TableData className={rbTableColumnClasses.role}>
        {!loaded ? (
          <Skeleton width="200px" height="20px" />
        ) : (
          roleMap?.roleMap[obj.roleBinding.roleRef.name]
        )}
      </TableData>
      <TableData className={rbTableColumnClasses.rolebinding}>
        {obj.roleBinding.metadata.name}
      </TableData>
      <TableData className={rbTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};
