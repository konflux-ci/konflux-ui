import { K8sModelCommon, K8sResourceCommon, K8sVerb } from './k8s';

export type AccessReviewResourceAttributes = {
  group?: string;
  resource?: string;
  subresource?: string;
  verb?: K8sVerb;
  namespace?: string;
};

export type AccessReviewResourceAttributesArray = AccessReviewResourceAttributes[];

export type AccessReviewResource = {
  model: K8sModelCommon;
  verb: K8sVerb;
};

export type AccessReviewResources = AccessReviewResource[];

export type SelfSubjectAccessReviewKind = K8sResourceCommon & {
  spec: {
    resourceAttributes?: AccessReviewResourceAttributes;
  };
  status?: {
    allowed: boolean;
    denied?: boolean;
    reason?: string;
    evaluationError?: string;
  };
};
