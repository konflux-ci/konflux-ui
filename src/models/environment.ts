import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const EnvironmentModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'Environment',
  plural: 'environments',
  namespaced: true,
};

export const EnvironmentGroupVersionKind: K8sGroupVersionKind = {
  group: EnvironmentModel.apiGroup,
  version: EnvironmentModel.apiVersion,
  kind: EnvironmentModel.kind,
};
