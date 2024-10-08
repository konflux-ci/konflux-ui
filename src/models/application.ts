import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const ApplicationModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'Application',
  plural: 'applications',
  namespaced: true,
};

export const ApplicationGroupVersionKind: K8sGroupVersionKind = {
  group: 'appstudio.redhat.com',
  version: 'v1alpha1',
  kind: 'Application',
};
