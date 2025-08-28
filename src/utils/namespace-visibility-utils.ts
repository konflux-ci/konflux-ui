import { K8sQueryCreateResource, K8sQueryDeleteResource } from '~/k8s';
import { RoleBindingModel } from '~/models';
import { RoleBinding } from '~/types';

export const PUBLIC_ROLE_BINDING_NAME = 'konflux-public-viewer';
export const VIEWER_ROLE_NAME = 'konflux-viewer-user-actions';

/**
 * Find the public role binding in a list of role bindings
 */
export const findPublicRoleBinding = (
  roleBindings: RoleBinding[] | undefined,
): RoleBinding | undefined => {
  return roleBindings?.find(
    (rb) =>
      rb.roleRef.name === VIEWER_ROLE_NAME &&
      rb.subjects?.some(
        (subject) => subject.kind === 'Group' && subject.name === 'system:authenticated',
      ),
  );
};

/**
 * Create a role binding to make a namespace publicly viewable
 */
export const createPublicRoleBinding = async (namespace: string): Promise<RoleBinding> => {
  const roleBinding: RoleBinding = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: {
      name: PUBLIC_ROLE_BINDING_NAME,
      namespace,
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: VIEWER_ROLE_NAME,
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Group',
        name: 'system:authenticated',
      },
    ],
  };

  return K8sQueryCreateResource({
    model: RoleBindingModel,
    resource: roleBinding,
    queryOptions: {
      ns: namespace,
    },
  });
};

/**
 * Delete a role binding to make a namespace private
 */
export const deletePublicRoleBinding = async (
  namespace: string,
  publicRoleBinding: RoleBinding,
): Promise<void> => {
  await K8sQueryDeleteResource({
    model: RoleBindingModel,
    queryOptions: {
      name: publicRoleBinding.metadata.name,
      ns: namespace,
    },
  });
};
