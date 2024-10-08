import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const SelfSubjectAccessReviewModel: K8sModelCommon = {
  apiGroup: 'authorization.k8s.io',
  apiVersion: 'v1',
  kind: 'SelfSubjectAccessReview',
  plural: 'selfsubjectaccessreviews',
};

export const SelfSubjectAccessReviewGroupVersionKind: K8sGroupVersionKind = {
  group: 'authorization.k8s.io',
  version: 'v1',
  kind: 'SelfSubjectAccessReview',
};
