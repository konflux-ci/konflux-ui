import { K8sGroupVersionKind, K8sModelCommon } from '../types/k8s';

export const NudgeConfigModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1beta2',
  kind: 'NudgeConfig',
  plural: 'nudgeconfigs',
  namespaced: true,
};

export const NudgeConfigGroupVersionKind: K8sGroupVersionKind = {
  group: NudgeConfigModel.apiGroup,
  version: NudgeConfigModel.apiVersion,
  kind: NudgeConfigModel.kind,
};
