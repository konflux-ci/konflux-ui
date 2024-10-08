import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const ReleasePlanModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'ReleasePlan',
  plural: 'releaseplans',
  namespaced: true,
};

export const ReleasePlanGroupVersionKind: K8sGroupVersionKind = {
  group: ReleasePlanModel.apiGroup,
  version: ReleasePlanModel.apiVersion,
  kind: ReleasePlanModel.kind,
};
