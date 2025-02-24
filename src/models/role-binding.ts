import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const RoleBindingModel: K8sModelCommon = {
  apiVersion: 'v1',
  apiGroup: 'rbac.authorization.k8s.io',
  kind: 'RoleBinding',
  plural: 'rolebindings',
};

export const RoleBindingGroupVersionKind: K8sGroupVersionKind = {
  group: RoleBindingModel.apiGroup,
  version: RoleBindingModel.apiVersion,
  kind: RoleBindingModel.kind,
};
