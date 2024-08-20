import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const ConfigMapModel: K8sModelCommon = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  plural: 'configmaps',
  namespaced: true,
};

export const ConfigMapGroupVersionKind: K8sGroupVersionKind = {
  version: ConfigMapModel.apiVersion,
  kind: ConfigMapModel.kind,
};
