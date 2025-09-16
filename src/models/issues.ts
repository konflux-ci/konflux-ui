import { K8sGroupVersionKind, K8sModelCommon } from "~/types/k8s";

export const IssuesModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'Issue',
  plural: 'Issues',
  namespaced: true,
};
export const ApplicationGroupVersionKind: K8sGroupVersionKind = {
  group: 'appstudio.redhat.com',
  version: 'v1alpha1',
  kind: 'Issue',
};
