import { RoleBinding } from '~/types';

/** One table row per subject so bindings with multiple users appear as multiple rows. */
export type UserAccessTableRow = {
  roleBinding: RoleBinding;
  /** Subject for this row; null when the binding has no subjects (shows "-"). */
  subject: NonNullable<RoleBinding['subjects']>[number] | null;
  rowKey: string;
};

export function expandRoleBindingsToTableRows(roleBindings: RoleBinding[]): UserAccessTableRow[] {
  return roleBindings.flatMap((roleBinding) => {
    const name = roleBinding.metadata?.name ?? 'unknown';
    const subjects = roleBinding.subjects;
    if (!subjects?.length) {
      return [
        {
          roleBinding,
          subject: null,
          rowKey: `${name}__no-subject`,
        },
      ];
    }
    return subjects.map((subject, index) => ({
      roleBinding,
      subject,
      rowKey: `${name}__${index}__${subject.kind}__${subject.name}`,
    }));
  });
}

export function filterUserAccessRowsByUsername(
  rows: UserAccessTableRow[],
  usernameFilter: string,
): UserAccessTableRow[] {
  const q = usernameFilter.trim().toLowerCase();
  if (!q) {
    return rows;
  }
  return rows.filter((row) => {
    if (!row.subject) {
      return false;
    }
    return row.subject.name.toLowerCase().includes(q);
  });
}
