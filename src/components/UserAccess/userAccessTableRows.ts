import { RoleBinding } from '~/types';

/**
 * Delimiter encoding `UserAccessTableRow.rowKey`.
 *
 * **Invariant:** `roleRef.name`, `subject.name`, `subject.kind`, and RoleBinding
 * `metadata.name` must not contain this separator. Konflux uses Kubernetes DNS subdomain
 * names (`[a-z0-9.-]`), which exclude `__`.
 *
 * Format: `{roleRef}{sep}{index}{sep}{kind}{sep}{name}{sep}{bindingName}`
 */
export const USER_ACCESS_ROW_KEY_SEPARATOR = '__';

const ROW_KEY_SEGMENT_COUNT = 5;

function assertRowKeyFieldHasNoSeparator(value: string, field: string): void {
  if (value.includes(USER_ACCESS_ROW_KEY_SEPARATOR)) {
    throw new Error(
      `User access row key field "${field}" must not contain "${USER_ACCESS_ROW_KEY_SEPARATOR}"`,
    );
  }
}

/** Builds a row key; only call from {@link expandRoleBindingsToTableRows} or tests. */
export function buildUserAccessRowKey({
  roleRefName,
  subjectIndex,
  subjectKind,
  subjectName,
  bindingName,
}: {
  roleRefName: string;
  subjectIndex: number;
  subjectKind: string;
  subjectName: string;
  bindingName: string;
}): string {
  assertRowKeyFieldHasNoSeparator(roleRefName, 'roleRefName');
  assertRowKeyFieldHasNoSeparator(subjectKind, 'subjectKind');
  assertRowKeyFieldHasNoSeparator(subjectName, 'subjectName');
  assertRowKeyFieldHasNoSeparator(bindingName, 'bindingName');

  return [roleRefName, String(subjectIndex), subjectKind, subjectName, bindingName].join(
    USER_ACCESS_ROW_KEY_SEPARATOR,
  );
}

export type ParsedUserAccessRowKey = {
  roleRefName: string;
  roleName: string;
  index: string;
  subjectKind: string;
  username: string;
  bindingName?: string;
};

/**
 * Decodes a row key produced by {@link buildUserAccessRowKey}.
 * Throws if the key has fewer than five segments (e.g. an embedded `__` in a field).
 */
export function splitRowKey(rowKey: string): ParsedUserAccessRowKey {
  const segments = rowKey.split(USER_ACCESS_ROW_KEY_SEPARATOR);
  if (segments.length !== ROW_KEY_SEGMENT_COUNT) {
    throw new Error(
      `Invalid user access row key: expected ${ROW_KEY_SEGMENT_COUNT} segments separated by "${USER_ACCESS_ROW_KEY_SEPARATOR}", got ${segments.length}`,
    );
  }

  const [roleRefName, index, subjectKind, username, bindingName] = segments;
  return {
    roleRefName,
    roleName: roleRefName.split('-')[1] ?? '',
    index,
    subjectKind,
    username,
    bindingName,
  };
}

/** One table row per subject so bindings with multiple users appear as multiple rows. */
export type UserAccessTableRow = {
  roleBinding: RoleBinding;
  /** Subject for this row; null when the binding has no subjects (shows "-"). */
  subject: NonNullable<RoleBinding['subjects']>[number] | null;
  /** Stable id from {@link buildUserAccessRowKey}; do not construct manually. */
  rowKey: string;
};

export function expandRoleBindingsToTableRows(roleBindings: RoleBinding[]): UserAccessTableRow[] {
  return roleBindings.flatMap((roleBinding) => {
    const roleRefName = roleBinding.roleRef?.name ?? 'unknown';
    const bindingName = roleBinding.metadata?.name ?? 'unknown-binding';
    const subjects = roleBinding.subjects;

    if (!subjects?.length) {
      return [
        {
          roleBinding,
          subject: null,
          rowKey: buildUserAccessRowKey({
            roleRefName,
            subjectIndex: 0,
            subjectKind: '-',
            subjectName: '-',
            bindingName,
          }),
        },
      ];
    }

    return subjects.map((subject, index) => ({
      roleBinding,
      subject,
      rowKey: buildUserAccessRowKey({
        roleRefName,
        subjectIndex: index,
        subjectKind: subject.kind,
        subjectName: subject.name,
        bindingName,
      }),
    }));
  });
}

export type UserAccessRowFilters = {
  username?: string;
  roleBindingName?: string;
};

export function filterUserAccessRows(
  rows: UserAccessTableRow[],
  filters: UserAccessRowFilters,
): UserAccessTableRow[] {
  const usernameQ = filters.username?.trim().toLowerCase() ?? '';
  if (usernameQ) {
    return rows.filter((row) => row.subject && row.subject.name.toLowerCase().includes(usernameQ));
  }

  const roleBindingQ = filters.roleBindingName?.trim().toLowerCase() ?? '';
  if (roleBindingQ) {
    return rows.filter((row) => {
      const name = row.roleBinding.metadata?.name?.toLowerCase() ?? '';
      return name.includes(roleBindingQ);
    });
  }

  return rows;
}
