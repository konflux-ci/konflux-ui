import type { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const KueueLocalQueueModel: K8sModelCommon = {
  apiGroup: 'visibility.kueue.x-k8s.io',
  apiVersion: 'v1beta2',
  kind: 'LocalQueue',
  plural: 'localqueues',
  namespaced: true,
};

export const KueueLocalQueueGroupVersionKind: K8sGroupVersionKind = {
  group: KueueLocalQueueModel.apiGroup,
  version: KueueLocalQueueModel.apiVersion,
  kind: KueueLocalQueueModel.kind,
};
