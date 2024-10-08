import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const SnapshotEnvironmentBindingModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'SnapshotEnvironmentBinding',
  plural: 'snapshotenvironmentbindings',
  namespaced: true,
};

export const SnapshotEnvironmentBindingGroupVersionKind: K8sGroupVersionKind = {
  group: SnapshotEnvironmentBindingModel.apiGroup,
  version: SnapshotEnvironmentBindingModel.apiVersion,
  kind: SnapshotEnvironmentBindingModel.kind,
};
