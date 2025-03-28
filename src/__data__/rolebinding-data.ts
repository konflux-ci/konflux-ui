import { RoleBinding } from '../types';

export const mockRoleBinding: RoleBinding = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'RoleBinding',
  metadata: { name: 'metadata-name', namespace: 'test-ns' },
  subjects: [{ apiGroup: 'rbac.authorization.k8s.io', name: 'user1', kind: 'User' }],
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: 'konflux-contributor-user-actions',
  },
};

export const mockRoleBindings: RoleBinding[] = [
  {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: { name: 'konflux-contributor-user1-actions-user', namespace: 'test-ns' },
    subjects: [{ apiGroup: 'rbac.authorization.k8s.io', name: 'user1', kind: 'User' }],
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'konflux-contributor-user-actions',
    },
  },
  {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: { name: 'konflux-maintainer-user2-actions-user', namespace: 'test-ns' },
    subjects: [{ apiGroup: 'rbac.authorization.k8s.io', name: 'user2', kind: 'User' }],
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'konflux-maintainer-user-actions',
    },
  },
  {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: { name: 'konflux-maintainer-user3-actions-user', namespace: 'test-ns' },
    subjects: [{ apiGroup: 'rbac.authorization.k8s.io', name: 'user3', kind: 'User' }],
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'konflux-maintainer-user-actions',
    },
  },
  {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: { name: 'konflux-maintainer-user4-actions-user', namespace: 'test-ns' },
    subjects: [{ apiGroup: 'rbac.authorization.k8s.io', name: 'user4', kind: 'User' }],
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'konflux-admin-user-actions',
    },
  },
];

export const mockRoleBindingWithoutUser: RoleBinding = {
  ...mockRoleBinding,
  subjects: mockRoleBinding.subjects.map((subject) =>
    subject.kind === 'User' ? { ...subject, kind: 'Group' } : subject,
  ),
};
