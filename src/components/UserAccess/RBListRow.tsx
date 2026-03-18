import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { useRoleMap } from '../../hooks/useRole';
import { RowFunctionArgs, TableData } from '../../shared';
import ActionMenu from '../../shared/components/action-menu/ActionMenu';
import { rbTableColumnClasses } from './RBListHeader';
import { useRBActions } from './user-access-actions';
import { UserAccessTableRow } from './userAccessTableRows';

export const RBListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<UserAccessTableRow>>> = ({
  obj,
}) => {
  const { roleBinding, subject } = obj;
  const actions = useRBActions(roleBinding);
  const [roleMap, loaded] = useRoleMap();

  return (
    <>
      <TableData className={rbTableColumnClasses.username}>{subject?.name ?? '-'}</TableData>
      <TableData className={rbTableColumnClasses.role}>
        {!loaded ? (
          <Skeleton width="200px" height="20px" />
        ) : (
          roleMap?.roleMap[roleBinding.roleRef.name]
        )}
      </TableData>
      <TableData className={rbTableColumnClasses.rolebinding}>
        {roleBinding.metadata.name}
      </TableData>
      <TableData className={rbTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};
