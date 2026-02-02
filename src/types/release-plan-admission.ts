import { K8sResourceCommon } from './k8s';

export type ReleasePlanAdmissionSpec = {
  applications: string[];
  displayName?: string;
  environment?: string;
  origin: string;
  releaseStrategy: string;
  data?: {
    releaseNotes?: {
      product_name?: string;
      product_version?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
};

export type ReleasePlanAdmissionKind = K8sResourceCommon & {
  spec: ReleasePlanAdmissionSpec;
};
