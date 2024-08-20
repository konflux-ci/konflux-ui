import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const ReleaseStrategyModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'ReleaseStrategy',
  plural: 'releasestrategies',
  namespaced: true,
};

export const ReleaseStrategyGroupVersionKind: K8sGroupVersionKind = {
  group: ReleaseStrategyModel.apiGroup,
  version: ReleaseStrategyModel.apiVersion,
  kind: ReleaseStrategyModel.kind,
};
