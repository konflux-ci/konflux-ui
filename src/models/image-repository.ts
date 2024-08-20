import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const ImageRepositoryModel: K8sModelCommon = {
  kind: 'ImageRepository',
  apiVersion: 'v1alpha1',
  apiGroup: 'appstudio.redhat.com',
  plural: 'imagerepositories',
  namespaced: true,
};

export const ImageRepositoryGroupVersionKind: K8sGroupVersionKind = {
  kind: ImageRepositoryModel.kind,
  group: ImageRepositoryModel.apiGroup,
  version: ImageRepositoryModel.apiVersion,
};
