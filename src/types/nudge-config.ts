import { K8sResourceCommon } from './k8s';

export type NudgeMode = 'immediate' | 'validated';

export type NudgeRelationship = {
  from: string;
  to: string;
  mode?: NudgeMode;
  // Reserved for Phase 2 group-based gating; not enforced yet.
  gatingGroup?: string;
};

export type NudgeConfigKind = K8sResourceCommon & {
  spec: {
    nudges?: NudgeRelationship[];
  };
};
