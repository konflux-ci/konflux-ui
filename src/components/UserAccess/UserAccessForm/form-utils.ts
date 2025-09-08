import * as yup from 'yup';
import { RoleMap } from '../../../hooks/useRole';
import {
  K8sQueryCreateResource,
  K8sQueryDeleteResource,
  K8sQueryListResourceItems,
} from '../../../k8s';
import { RoleBindingGroupVersionKind, RoleBindingModel } from '../../../models';
import { RoleBinding, NamespaceRole } from '../../../types';

export type UserAccessFormValues = {
  usernames: string[];
  role: NamespaceRole;
  roleMap: RoleMap;
};

export const userAccessFormSchema = yup.object({
  usernames: yup.array().min(1, 'Must have at least 1 username.').required('Required.'),
  role: yup
    .string()
    .matches(/Contributor|Maintainer|Admin/, 'Invalid role.')
    .required('Required.'),
});

export const getRBs = (namespace: string): Promise<RoleBinding[]> => {
  return K8sQueryListResourceItems({
    model: RoleBindingModel,
    queryOptions: {
      ns: namespace,
    },
  });
};

export const sanitizeUsername = (username: string) => {
  let sanitized = username.toLowerCase();
  sanitized = sanitized.replace(/[^a-z0-9-]/g, '-');
  // Remove leading and trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  return sanitized;
};

/**
 * Create role-bindings to shared konflux cluster roles
 */
export const createRBs = async (
  values: UserAccessFormValues,
  namespace: string,
  dryRun?: boolean,
): Promise<RoleBinding[]> => {
  const { usernames, role, roleMap } = values;
  const konfluxRoles = Object.keys(roleMap?.roleMap);
  const roleRefName = konfluxRoles.find((konfluxRole) => konfluxRole.includes(role.toLowerCase()));
  const objs: RoleBinding[] = usernames.map((username) => ({
    apiVersion: `${RoleBindingGroupVersionKind.group}/${RoleBindingGroupVersionKind.version}`,
    kind: RoleBindingGroupVersionKind.kind,
    metadata: {
      // To sanitize the username and ensure every user just has one role
      // in the namespace.
      name: `konflux-${role.toLowerCase()}-${sanitizeUsername(username)}-user-actions`,
      namespace,
    },
    roleRef: {
      apiGroup: RoleBindingGroupVersionKind.group,
      name: roleRefName,
      kind: roleMap?.roleKind,
    },
    subjects: [
      {
        kind: 'User',
        apiGroup: RoleBindingGroupVersionKind.group,
        name: username,
      },
    ],
  }));

  return Promise.all(
    objs.map((obj) =>
      K8sQueryCreateResource({
        model: RoleBindingModel,
        queryOptions: {
          ns: namespace,
          ...(dryRun && { queryParams: { dryRun: 'All' } }),
        },
        resource: obj,
      }),
    ),
  );
};

export const deleteRB = async (roleBinding: RoleBinding, dryRun?: boolean): Promise<void> => {
  const queryOptions = {
    model: RoleBindingModel,
    queryOptions: {
      name: roleBinding.metadata.name,
      ns: roleBinding.metadata.namespace,
      ...(dryRun && { queryParams: { dryRun: 'All' } }),
    },
  };

  await K8sQueryDeleteResource(queryOptions);
};

/**
 * The resource "rolebindings" in API group "rbac.authorization.k8s.io" does not
 * support patch roleRef. And if you try to patch the rolebinding by kubctl directly,
 * you would get the error 'cannot change roleRef'.
 * In this case, we need to create one with the new role then delete the
 * obsoleted one.
 *
 * Only updates one RB, but returning array to keep it consistent with `createRBs()`.
 */
export const editRB = async (
  values: UserAccessFormValues,
  roleBinding: RoleBinding,
  dryRun?: boolean,
): Promise<RoleBinding[]> => {
  const { usernames, role, roleMap } = values;

  if (!dryRun) {
    await deleteRB(roleBinding, dryRun);
  }

  // Create new role bindings after we delete roles
  const newRoleBindings = await createRBs(
    { usernames, role, roleMap },
    roleBinding.metadata.namespace,
    dryRun,
  );

  return newRoleBindings;
};
