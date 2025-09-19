import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const IssueModel: K8sModelCommon = {
  // apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1',
  kind: 'Issue',
  plural: 'issues',
  // namespaced: true,
};

export const IssueGroupVersionKind: K8sGroupVersionKind = {
  // group: IssueModel.apiGroup,
  version: IssueModel.apiVersion,
  kind: IssueModel.kind,
};
