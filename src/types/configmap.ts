import { K8sResourceCommon } from './k8s';

export type ConfigMap = K8sResourceCommon & {
  data: {
    [key: string]: string;
  };
};
