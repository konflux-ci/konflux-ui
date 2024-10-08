import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const TaskRunModel: K8sModelCommon = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  kind: 'TaskRun',
  plural: 'taskruns',
  namespaced: true,
};

export const TaskRunGroupVersionKind: K8sGroupVersionKind = {
  group: 'tekton.dev',
  version: 'v1',
  kind: 'TaskRun',
};
