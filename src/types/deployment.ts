import { K8sResourceCommon } from './k8s';

export type DeploymentKind = {
  spec: {};
  status: {};
} & K8sResourceCommon;
