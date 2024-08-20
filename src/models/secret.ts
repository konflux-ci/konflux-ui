import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const SecretModel: K8sModelCommon = {
  apiVersion: 'v1',
  plural: 'secrets',
  namespaced: true,
  kind: 'Secret',
};

export const SecretGroupVersionKind: K8sGroupVersionKind = {
  version: 'v1',
  kind: 'Secret',
};
