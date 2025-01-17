import React from 'react';
import { useK8sWatchResource } from '../k8s';
import { RoleBindingGroupVersionKind, RoleBindingModel } from '../models';
import { RoleBinding } from '../types';
import { useRoleMap } from './useRole';

export const useRoleBindings = (
  namespace: string,
  watch?: boolean,
): [RoleBinding[], boolean, unknown] => {
  const {
    data: bindings,
    isLoading: bindingsLoading,
    error,
  } = useK8sWatchResource<RoleBinding[]>(
    {
      groupVersionKind: RoleBindingGroupVersionKind,
      namespace,
      isList: true,
      watch,
    },
    RoleBindingModel,
  );
  const [roleMap, roleMapLoading, roleMapError] = useRoleMap(watch);
  const konfluxRBs: RoleBinding[] = React.useMemo(
    () =>
      !roleMapError && !bindingsLoading && !roleMapLoading && Array.isArray(bindings) && roleMap
        ? bindings?.filter((rb) => Object.keys(roleMap).includes(rb.roleRef.name))
        : [],
    [bindings, bindingsLoading, roleMap, roleMapLoading, roleMapError],
  );

  return [konfluxRBs, bindingsLoading, error || roleMapError];
};
