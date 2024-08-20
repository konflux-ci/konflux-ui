import { K8sModelCommon } from '../types/k8s';

export const WorkspaceModel: K8sModelCommon = {
  apiVersion: 'v1alpha1',
  apiGroup: 'toolchain.dev.openshift.com',
  kind: 'Workspace',
  plural: 'workspaces',
};
