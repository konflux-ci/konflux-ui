import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const ReleaseModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'Release',
  plural: 'releases',
  namespaced: true,
};

export const ReleaseGroupVersionKind: K8sGroupVersionKind = {
  group: ReleaseModel.apiGroup,
  version: ReleaseModel.apiVersion,
  kind: ReleaseModel.kind,
};
