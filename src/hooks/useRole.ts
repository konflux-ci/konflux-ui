import React from 'react';
import { KonfluxRbacItem } from '../types/konflux-public-info';
import { useKonfluxPublicInfo } from './useKonfluxPublicInfo';

type RoleAndNameMap = {
  [key: string]: string;
};

export type RoleKind = 'ClusterRole' | 'Role';

export type RoleMap = {
  roleMap: RoleAndNameMap;
  /** Higher value = more privileged; derived from `konflux-public-info` rbac list order (first entry is highest). */
  roleRefWeights: Record<string, number>;
  roleKind: RoleKind;
  roleDescription: RoleAndNameMap;
};

/** Derive privilege rank from rbac config order (earlier entries are more privileged). */
export const buildRoleRefWeightsFromRbacItems = (
  rbacItems: KonfluxRbacItem[],
): Record<string, number> =>
  rbacItems.reduce<Record<string, number>>((weights, item, index) => {
    const roleRefName = item.roleRef?.name;
    if (roleRefName) {
      weights[roleRefName] = rbacItems.length - index;
    }
    return weights;
  }, {});

export const useRoleMap = (): [RoleMap, boolean, unknown] => {
  const [konfluxInfo, loaded, error] = useKonfluxPublicInfo();

  // Memoize the result of role map transformation for performance
  const transformedRoleMap: RoleMap | undefined = React.useMemo(() => {
    let roleAndNameMap: RoleAndNameMap;
    let roleKind: RoleKind;
    let roleDescription: RoleAndNameMap;

    if (loaded && !error && konfluxInfo) {
      const rbacItems: KonfluxRbacItem[] = konfluxInfo?.rbac || [];

      // Get the roleMap
      roleAndNameMap = rbacItems?.reduce((accumulator, currentValue) => {
        const roleName = currentValue?.roleRef?.name;
        accumulator[roleName] = currentValue?.displayName.replace(/^[a-z]/, (match) =>
          match.toUpperCase(),
        );
        return accumulator;
      }, {});

      // Get the roleKind
      const uniqueRoleKinds = [...new Set(rbacItems?.map((binding) => binding.roleRef.kind))];
      if (uniqueRoleKinds.length === 1) {
        roleKind = uniqueRoleKinds[0] as RoleKind;
      }

      // Get the description
      roleDescription = rbacItems?.reduce((accumulator, currentValue) => {
        const roleName = currentValue?.roleRef?.name;
        accumulator[roleName] = currentValue?.description;
        return accumulator;
      }, {});

      const roleRefWeights = buildRoleRefWeightsFromRbacItems(rbacItems);

      // format final data
      const roleMap: RoleMap = {
        roleMap: roleAndNameMap,
        roleRefWeights,
        roleKind,
        roleDescription,
      };

      return roleMap;
    }
  }, [konfluxInfo, loaded, error]);

  return [transformedRoleMap, loaded, error];
};
