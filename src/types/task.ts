import { TektonTaskSpec } from './coreTekton';
import { K8sResourceCommon } from './k8s';

export type TaskKind = K8sResourceCommon & {
  spec: TektonTaskSpec;
};
