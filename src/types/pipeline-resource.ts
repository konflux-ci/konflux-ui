import { K8sResourceCommon } from './k8s';

export type PipelineResourceKind = K8sResourceCommon & {
  spec: {
    params: { name: string; value: string }[];
    type: string;
  };
};
