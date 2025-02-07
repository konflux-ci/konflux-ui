import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const NamespaceModel: K8sModelCommon = {
  apiVersion: 'v1',
  kind: 'Namespace',
  plural: 'namespaces',
};

export const NamespaceGroupVersionKind: K8sGroupVersionKind = {
  version: NamespaceModel.apiVersion,
  kind: NamespaceModel.kind,
};
