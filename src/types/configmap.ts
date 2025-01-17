import { K8sResourceCommon } from './k8s';

export type ConfigMap = K8sResourceCommon & {
  kind: string;
  apiVersion: string;
  metadata: {
    name: string;
    namespace: string;
  };
  data: string;
};
