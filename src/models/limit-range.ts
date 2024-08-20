import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const LimitRangeModel: K8sModelCommon = {
  apiVersion: 'v1',
  plural: 'limitranges',
  namespaced: true,
  kind: 'LimitRange',
};

export const LimitRangeGroupVersionKind: K8sGroupVersionKind = {
  version: LimitRangeModel.apiVersion,
  kind: LimitRangeModel.kind,
};
