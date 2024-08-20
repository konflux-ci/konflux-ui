import { K8sModelCommon } from '../types/k8s';

export const ProjectModel: K8sModelCommon = {
  apiVersion: 'v1',
  apiGroup: 'project.openshift.io',
  kind: 'Project',
  plural: 'projects',
};
