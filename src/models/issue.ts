import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const IssueModel: K8sModelCommon = {
  apiVersion: 'v1',
  kind: 'Issue',
  plural: 'issues',
};

export const IssueGroupVersionKind: K8sGroupVersionKind = {
  version: IssueModel.apiVersion,
  kind: IssueModel.kind,
};
