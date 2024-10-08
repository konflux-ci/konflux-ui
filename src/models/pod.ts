import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const PodModel: K8sModelCommon = {
  apiVersion: 'v1',
  // t('public~Pod')
  plural: 'pods',
  namespaced: true,
  kind: 'Pod',
  // t('public~Pods')
};

export const PodGroupVersionKind: K8sGroupVersionKind = {
  version: 'v1',
  kind: 'Pod',
};
