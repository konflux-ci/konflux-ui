import React from 'react';
import { useK8sWatchResource } from '../k8s';
import { RoleBindingGroupVersionKind, RoleBindingModel } from '../models';
import { RoleBinding } from '../types';
import { useRoleMap } from './useRole';

export const useRoleBindings = (namespace: string): [RoleBinding[], boolean, unknown] => {
  const {
    data: bindings,
    isLoading,
    error,
  } = useK8sWatchResource<RoleBinding[]>(
    {
      groupVersionKind: RoleBindingGroupVersionKind,
      namespace,
      isList: true,
    },
    RoleBindingModel,
  );
  const [roleMap, loaded, roleMapError] = useRoleMap();
  const konfluxRBs: RoleBinding[] = React.useMemo(
    () =>
      !roleMapError && !isLoading && loaded && Array.isArray(bindings) && roleMap?.roleMap
        ? bindings?.filter((rb) => Object.keys(roleMap?.roleMap).includes(rb?.roleRef?.name))
        : [],
    [bindings, isLoading, roleMap, loaded, roleMapError],
  );

  return [konfluxRBs, !isLoading, error || roleMapError];
};

export const useRoleBinding = (
  namespace: string,
  name: string,
  watch?: boolean,
): [RoleBinding, boolean, unknown] => {
  const {
    data: binding,
    isLoading,
    error,
  } = useK8sWatchResource<RoleBinding>(
    {
      groupVersionKind: RoleBindingGroupVersionKind,
      namespace,
      name,
      watch,
    },
    RoleBindingModel,
  );
  const [roleMap, loaded, roleMapError] = useRoleMap();
  const konfluxRB: RoleBinding | undefined = React.useMemo(
    () =>
      !roleMapError &&
      !isLoading &&
      loaded &&
      roleMap?.roleMap &&
      Object.keys(roleMap?.roleMap).includes(binding?.roleRef?.name)
        ? binding
        : undefined,
    [binding, isLoading, roleMap, loaded, roleMapError],
  );

  return [konfluxRB, !isLoading, error || roleMapError];
};
