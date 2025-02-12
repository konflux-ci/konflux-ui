import React from 'react';
import { useKonfluxPublicInfo } from './useKonfluxPublicInfo';

type roleMap = Record<string, string>;

export const useRoleMap = (watch?: boolean): [roleMap, boolean, unknown] => {
  const [konfluxInfo, isLoading, error] = useKonfluxPublicInfo(watch);
  const roleMap: roleMap = {};

  // Memoize the result of role map transformation for performance
  const transformedRoleMap = React.useMemo(() => {
    if (!isLoading && !error && konfluxInfo) {
      const rbacItems = konfluxInfo?.rbac;
      Array.isArray(rbacItems) &&
        rbacItems.forEach((role) => {
          if (role?.roleRef?.name && role.displayName) {
            roleMap[role.roleRef.name] = role.displayName;
          }
        });
    }
    return roleMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [konfluxInfo, isLoading, error]);

  return [transformedRoleMap, isLoading, error];
};
