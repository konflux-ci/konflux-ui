import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const RemoteSecretModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1beta1',
  plural: 'remotesecrets',
  namespaced: true,
  kind: 'RemoteSecret',
};

export const RemoteSecretGroupVersionKind: K8sGroupVersionKind = {
  group: 'appstudio.redhat.com',
  version: 'v1beta1',
  kind: 'RemoteSecret',
};
