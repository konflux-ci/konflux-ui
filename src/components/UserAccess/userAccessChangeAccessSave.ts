import type { RoleMap } from '~/hooks/useRole';
import { logger } from '~/monitoring/logger';
import type { NamespaceRole, RoleBinding } from '~/types';
import { createRBs, deleteRB, restoreRB } from './UserAccessForm/form-utils';
import { splitRowKey } from './userAccessTableRows';

export function getUniqueSelectedUsers(rowKeys: Set<string>): Set<string> {
  return new Set([...rowKeys].map((rowKey) => splitRowKey(rowKey).username));
}

export function getAllAffectedRoleBindings(
  users: Set<string>,
  bindings: RoleBinding[],
): RoleBinding[] {
  return bindings.filter((rb) => rb.subjects?.some((subject) => users.has(subject.name)));
}

export function roleBindingHasNonUserSubject(rb: RoleBinding): boolean {
  return (rb.subjects ?? []).some((subject) => subject.kind !== 'User');
}

export function userHasRoleBindingOutsideDeletions(
  username: string,
  roleRefName: string,
  allBindings: RoleBinding[],
  bindingsToDelete: RoleBinding[],
): boolean {
  const deleteNames = new Set(
    bindingsToDelete.map((rb) => rb.metadata?.name).filter((name): name is string => Boolean(name)),
  );
  return allBindings.some(
    (rb) =>
      !deleteNames.has(rb.metadata?.name ?? '') &&
      rb.roleRef?.name === roleRefName &&
      (rb.subjects ?? []).some((subject) => subject.kind === 'User' && subject.name === username),
  );
}

/** Snapshot for rollback; clone nested fields read by restoreRB so in-place edits cannot affect the original. */
export function cloneRoleBindingSnapshot(rb: RoleBinding): RoleBinding {
  return {
    ...rb,
    roleRef: { ...rb.roleRef },
    subjects: rb.subjects?.map((subject) => ({ ...subject })),
  };
}

export type ChangeAccessSaveSnapshot = {
  selectedRowKeys: Set<string>;
  roleBindings: RoleBinding[];
};

export function snapshotChangeAccessSaveContext(
  selectedRowKeys: Set<string>,
  roleBindings: RoleBinding[],
): ChangeAccessSaveSnapshot {
  return {
    selectedRowKeys: new Set(selectedRowKeys),
    roleBindings: roleBindings.map(cloneRoleBindingSnapshot),
  };
}

async function deleteBindingsBestEffort(
  bindings: RoleBinding[],
  namespace: string,
  logMessage: string,
): Promise<void> {
  await Promise.all(
    bindings.map(async (rb) => {
      try {
        await deleteRB(rb);
      } catch (rollbackErr: unknown) {
        logger.warn(logMessage, {
          namespace,
          roleBindingName: rb.metadata?.name,
          error: rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
        });
      }
    }),
  );
}

/** Restore in reverse deletion order so dependent bindings behave predictably. */
async function restoreBindingsBestEffort(
  snapshots: RoleBinding[],
  namespace: string,
): Promise<void> {
  for (let i = snapshots.length - 1; i >= 0; i -= 1) {
    const snap = snapshots[i];
    try {
      await restoreRB(snap);
    } catch (rollbackErr: unknown) {
      logger.warn('Failed to restore RoleBinding during rollback', {
        namespace,
        roleBindingName: snap.metadata?.name,
        error: rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
      });
    }
  }
}

export type PerformUserAccessRoleChangeParams = {
  newRoleRef: string;
  selectedRowKeys: Set<string>;
  roleBindings: RoleBinding[];
  currentRoleMap: Record<string, NamespaceRole>;
  roleMap: RoleMap;
  namespace: string;
  onSuccessClearSelection: () => void;
};

export async function performUserAccessRoleChange({
  newRoleRef,
  selectedRowKeys,
  roleBindings,
  currentRoleMap,
  roleMap,
  namespace,
  onSuccessClearSelection,
}: PerformUserAccessRoleChangeParams): Promise<void> {
  const selectedUsernames = getUniqueSelectedUsers(selectedRowKeys);
  const rawBindings = getAllAffectedRoleBindings(selectedUsernames, roleBindings);

  if (rawBindings.some(roleBindingHasNonUserSubject)) {
    throw new Error(
      'Cannot change roles when a selected subject shares a role binding with a non-User subject (Group or ServiceAccount). Edit or split that role binding in the cluster, then try again.',
    );
  }

  const usernamesSkippingTargetRoleCreate = new Set<string>();
  const toDelete = rawBindings.filter((rb) => {
    const hasSingleTargetRole = rb.subjects?.length === 1 && rb.roleRef?.name === newRoleRef;
    const username = rb.subjects?.[0]?.name;

    if (hasSingleTargetRole && username) {
      usernamesSkippingTargetRoleCreate.add(username);
    }
    return !hasSingleTargetRole;
  });

  const usernamesNeedingTargetRoleCreate = [...selectedUsernames].filter(
    (username) =>
      !usernamesSkippingTargetRoleCreate.has(username) &&
      !userHasRoleBindingOutsideDeletions(username, newRoleRef, roleBindings, toDelete),
  );

  const preservedFromMultiSubject = toDelete
    .filter((rb) => (rb.subjects?.length ?? 0) > 1)
    .flatMap((rb) => {
      const currentRole = currentRoleMap[rb.roleRef.name];
      if (!currentRole) {
        throw new Error(`Role "${rb.roleRef.name}" not found in role map. Cannot preserve access.`);
      }
      return (
        rb.subjects
          ?.filter((subject) => !selectedUsernames.has(subject.name))
          .map((subject): [string, NamespaceRole] => [subject.name, currentRole])
          .filter(
            ([username]) =>
              !userHasRoleBindingOutsideDeletions(
                username,
                rb.roleRef.name,
                roleBindings,
                toDelete,
              ),
          ) ?? []
      );
    });

  const newRole = currentRoleMap[newRoleRef];
  if (!newRole) {
    throw new Error(`Target role "${newRoleRef}" not found in role map.`);
  }
  const deletedSnapshots: RoleBinding[] = [];
  const createdBindings: RoleBinding[] = [];

  try {
    if (usernamesNeedingTargetRoleCreate.length > 0) {
      createdBindings.push(
        ...(await createRBs(
          { usernames: usernamesNeedingTargetRoleCreate, role: newRole, roleMap },
          namespace,
        )),
      );
    }

    for (const [username, preservedRole] of preservedFromMultiSubject) {
      createdBindings.push(
        ...(await createRBs({ usernames: [username], role: preservedRole, roleMap }, namespace)),
      );
    }

    for (const rb of toDelete) {
      await deleteRB(rb);
      deletedSnapshots.push(cloneRoleBindingSnapshot(rb));
    }

    onSuccessClearSelection();
  } catch (err: unknown) {
    await restoreBindingsBestEffort(deletedSnapshots, namespace);
    await deleteBindingsBestEffort(
      createdBindings,
      namespace,
      'Failed to delete partially created RoleBinding after user access change failure',
    );
    logger.error(
      'Error while applying user access role change',
      err instanceof Error ? err : new Error(String(err)),
      { namespace },
    );
    throw err;
  }
}
