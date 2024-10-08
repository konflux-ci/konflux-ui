import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const DeploymentModel: K8sModelCommon = {
  apiVersion: 'v1',
  apiGroup: 'apps',
  plural: 'deployments',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Deployment',
};

export const DeploymentGroupVersionKind: K8sGroupVersionKind = {
  group: DeploymentModel.apiGroup,
  version: DeploymentModel.apiVersion,
  kind: DeploymentModel.kind,
};
