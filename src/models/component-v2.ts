import { K8sGroupVersionKind, K8sModelCommon } from '~/types/k8s';

export const ComponentModelV2: K8sModelCommon = {
  apiGroup: 'konflux-ci.dev',
  apiVersion: 'v1alpha1',
  kind: 'Component',
  plural: 'components',
  namespaced: true,
};

export const ComponentGroupVersionKindV2: K8sGroupVersionKind = {
  group: ComponentModelV2.apiGroup,
  version: ComponentModelV2.apiVersion,
  kind: ComponentModelV2.kind,
};
