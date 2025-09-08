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
  const [roleMap, loaded] = useRoleMap();

  return (
    <>
      <TableData className={rbTableColumnClasses.username}>
        {obj.subjects ? obj.subjects[0]?.name : '-'}
      </TableData>
      <TableData className={rbTableColumnClasses.role}>
        {!loaded ? <Skeleton width="200px" height="20px" /> : roleMap?.roleMap[obj.roleRef.name]}
      </TableData>
      <TableData className={rbTableColumnClasses.rolebinding}>{obj.metadata.name}</TableData>
      <TableData className={rbTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};
