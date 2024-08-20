import { K8sResourceCommon } from './k8s';

export type EnterpriseContractPolicyKind = K8sResourceCommon & {
  spec: {
    description?: string;
    sources: {
      git?: {
        repository: string;
        revision?: string;
      };
    }[];
    exceptions?: {
      nonBlocking?: string[];
    };
    authorization?: {
      changeId?: string;
      repository?: string;
      authorizer?: string;
    };
    rekorUrl?: string;
    publicKey?: string;
  };
};
