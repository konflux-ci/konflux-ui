import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const ServiceAccountModel: K8sModelCommon = {
  apiVersion: 'v1',
  plural: 'serviceaccounts',
  namespaced: true,
  kind: 'ServiceAccount',
};

export const ServiceAccountGroupVersionKind: K8sGroupVersionKind = {
  version: 'v1',
  kind: 'ServiceAccount',
};
