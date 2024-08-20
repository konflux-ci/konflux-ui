import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const PipelineModel: K8sModelCommon = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  kind: 'Pipeline',
  plural: 'pipelines',
  namespaced: true,
};

export const PiplineGroupVersionKind: K8sGroupVersionKind = {
  group: 'tekton.dev',
  version: 'v1',
  kind: 'Pipeline',
};
