import { K8sGroupVersionKind, K8sModelCommon } from '~/types/k8s';

export const ComponentGroupModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1beta2',
  kind: 'ComponentGroup',
  plural: 'componentgroups',
  namespaced: true,
};

export const ComponentGroupGroupVersionKind: K8sGroupVersionKind = {
  group: ComponentGroupModel.apiGroup,
  version: ComponentGroupModel.apiVersion,
  kind: ComponentGroupModel.kind,
};
