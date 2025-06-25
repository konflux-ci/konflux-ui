import { K8sResourceCommon } from './k8s';

export type RoleBinding = K8sResourceCommon & {
  roleRef: {
    apiGroup: string;
    kind: string;
    name: string;
  };
  subjects?: {
    apiGroup: string;
    kind: string;
    name: string;
  }[];
};
