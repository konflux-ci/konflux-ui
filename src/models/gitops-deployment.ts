import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const GitOpsDeploymentModal: K8sModelCommon = {
  apiGroup: 'managed-gitops.redhat.com',
  apiVersion: 'v1alpha1',
  plural: 'gitopsdeployments',
  namespaced: true,
  kind: 'GitOpsDeployment',
};

export const GitOpsDeploymentGroupVersionKind: K8sGroupVersionKind = {
  group: GitOpsDeploymentModal.apiGroup,
  version: GitOpsDeploymentModal.apiVersion,
  kind: GitOpsDeploymentModal.kind,
};

export const GitOpsDeploymentManagedEnvironmentModal: K8sModelCommon = {
  apiGroup: 'managed-gitops.redhat.com',
  apiVersion: 'v1alpha1',
  plural: 'gitopsdeploymentmanagedenvironments',
  namespaced: true,
  kind: 'GitOpsDeploymentManagedEnvironment',
};

export const GitOpsDeploymentManagedEnvironmentGroupVersionKind: K8sGroupVersionKind = {
  group: GitOpsDeploymentManagedEnvironmentModal.apiGroup,
  version: GitOpsDeploymentManagedEnvironmentModal.apiVersion,
  kind: GitOpsDeploymentManagedEnvironmentModal.kind,
};
