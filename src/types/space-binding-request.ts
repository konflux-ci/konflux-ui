import { K8sResourceCommon } from './k8s';
import { WorkspaceRole } from './workspace';

export type SpaceBindingRequest = K8sResourceCommon & {
  spec: {
    masterUserRecord: string;
    spaceRole: WorkspaceRole;
  };
  status?: {
    conditions?: {
      reason?: string;
      message?: string;
      status?: string;
      ready?: string;
    }[];
  };
};
