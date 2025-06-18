import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const CronJobModel: K8sModelCommon = {
  apiGroup: 'batch',
  apiVersion: 'v1',
  plural: 'cronjobs',
  namespaced: true,
  kind: 'CronJob',
};

export const CronJobGroupVersionKind: K8sGroupVersionKind = {
  group: 'batch',
  version: 'v1',
  kind: 'CronJob',
}; 