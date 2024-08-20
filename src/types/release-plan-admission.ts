import { K8sResourceCommon } from './k8s';

export type ReleasePlanAdmissionSpec = {
  application: string;
  displayName?: string;
  environment?: string;
  origin: string;
  releaseStrategy: string;
};

export type ReleasePlanAdmissionKind = K8sResourceCommon & {
  spec: ReleasePlanAdmissionSpec;
};
