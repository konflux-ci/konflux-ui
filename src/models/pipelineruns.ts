import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const PipelineRunModel: K8sModelCommon = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  kind: 'PipelineRun',
  plural: 'pipelineruns',
  namespaced: true,
};

export const PipelineRunGroupVersionKind: K8sGroupVersionKind = {
  group: 'tekton.dev',
  version: 'v1',
  kind: 'PipelineRun',
};
