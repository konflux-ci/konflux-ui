import { K8sResourceCommon } from './k8s';

export type ReleaseStrategySpec = {
  bundle?: string;
  params?: { name: string; value?: string; values?: string }[];
  pipeline: string;
  policy: string;
  serviceAccount?: string;
  persistentVolumeClaim?: string;
};

export type ReleaseStrategyKind = K8sResourceCommon & {
  spec: ReleaseStrategySpec;
};
