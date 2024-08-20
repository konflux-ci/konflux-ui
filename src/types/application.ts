import { K8sResourceCommon } from './k8s';

export type ApplicationKind = K8sResourceCommon & {
  spec: {
    displayName: string;
    appModelRepository?: {
      url: string;
    };
    gitOpsRepository?: {
      url: string;
    };
  };
};
