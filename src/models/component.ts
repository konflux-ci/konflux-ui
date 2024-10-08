import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const ComponentModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'Component',
  plural: 'components',
  namespaced: true,
};

export const ComponentGroupVersionKind: K8sGroupVersionKind = {
  group: 'appstudio.redhat.com',
  version: 'v1alpha1',
  kind: 'Component',
};

export const ComponentDetectionQueryModel = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'ComponentDetectionQuery',
  plural: 'componentdetectionqueries',
  namespaced: true,
};

export const ComponentDetectionQueryGroupVersionKind: K8sGroupVersionKind = {
  group: 'appstudio.redhat.com',
  version: 'v1alpha1',
  kind: 'ComponentDetectionQuery',
};
