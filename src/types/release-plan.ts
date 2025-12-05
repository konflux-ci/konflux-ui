import { K8sResourceCommon } from './k8s';

export type ReleasePlanKind = K8sResourceCommon & {
  spec: {
    application: string;
    target: string;
  };
  status?: {
    releasePlanAdmission?: {
      name: string;
    };
  };
};
