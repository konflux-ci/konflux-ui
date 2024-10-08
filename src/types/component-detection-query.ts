import { ComponentSpecs } from './component';
import { K8sResourceCommon } from './k8s';

export type DetectedComponents = {
  [key: string]: {
    componentStub: ComponentSpecs;
    language?: string;
    projectType?: string;
    devfileFound?: boolean;
  };
};

export type ComponentDetectionQueryKind = K8sResourceCommon & {
  spec: {
    git: {
      url: string;
    };
  };
  isMultiComponent?: boolean;
  status?: {
    componentDetected?: DetectedComponents;
    conditions?: { type: string; status: string; reason: string; message: string }[];
  };
};
