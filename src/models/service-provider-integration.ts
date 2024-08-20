import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const SPIAccessTokenBindingModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1beta1',
  kind: 'SPIAccessTokenBinding',
  plural: 'spiaccesstokenbindings',
  namespaced: true,
};

export const SPIAccessCheckModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1beta1',
  kind: 'SPIAccessCheck',
  plural: 'spiaccesschecks',
  namespaced: true,
};

export const SPIAccessTokenBindingGroupVersionKind: K8sGroupVersionKind = {
  group: 'appstudio.redhat.com',
  version: 'v1beta1',
  kind: 'SPIAccessTokenBinding',
};

export const SPIAccessCheckGroupVersionKind: K8sGroupVersionKind = {
  group: 'appstudio.redhat.com',
  version: 'v1beta1',
  kind: 'SPIAccessCheck',
};
