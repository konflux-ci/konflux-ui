import * as React from 'react';
import { performUserAccessRoleChange } from '~/components/UserAccess/userAccessChangeAccessSave';
import type { RoleMap } from '~/hooks/useRole';
import type { NamespaceRole, RoleBinding } from '~/types';

export type UseChangeAccessSaveParams = {
  namespace: string;
  currentRoleMap: Record<string, NamespaceRole>;
  roleBindings: RoleBinding[];
  roleMap: RoleMap;
  selectedRowKeys: Set<string>;
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
};

/**
 * Returns a save handler for the change-access modal.
 * Pass stable `selectedRowKeys` and `roleBindings` frozen at modal open so saves are not
 * affected by watch updates between opening the modal and clicking Save.
 */
export function useChangeAccessSave({
  namespace,
  currentRoleMap,
  roleBindings,
  roleMap,
  selectedRowKeys,
  setSelectedRowKeys,
}: UseChangeAccessSaveParams): (newRoleRef: string) => Promise<void> {
  return React.useCallback(
    async (newRoleRef: string) => {
      await performUserAccessRoleChange({
        newRoleRef,
        selectedRowKeys,
        roleBindings,
        currentRoleMap,
        roleMap,
        namespace,
        onSuccessClearSelection: () => setSelectedRowKeys(new Set()),
      });
    },
    [currentRoleMap, namespace, roleBindings, roleMap, selectedRowKeys, setSelectedRowKeys],
  );
}
