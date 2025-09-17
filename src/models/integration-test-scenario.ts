import { K8sModelCommon, K8sGroupVersionKind } from '../types/k8s';

export const IntegrationTestScenarioModel: K8sModelCommon = {
  apiGroup: 'appstudio.redhat.com',
  apiVersion: 'v1beta2',
  kind: 'IntegrationTestScenario',
  plural: 'integrationtestscenarios',
  namespaced: true,
};

export const IntegrationTestScenarioGroupVersionKind: K8sGroupVersionKind = {
  group: IntegrationTestScenarioModel.apiGroup,
  version: IntegrationTestScenarioModel.apiVersion,
  kind: IntegrationTestScenarioModel.kind,
};
