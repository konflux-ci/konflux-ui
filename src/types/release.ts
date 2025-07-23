import { K8sResourceCommon } from './k8s';

export enum ReleaseCondition {
  Processed = 'Processed',
  Validated = 'Validated',
  Released = 'Released',
}

export type ReleaseArtifactsImages = {
  arches?: string[];
  name: string;
  oses?: string[];
  shasum?: string;
  urls?: string[];
};

export type ReleaseArtifacts = {
  images?: ReleaseArtifactsImages[];
  index_image?: {
    target_index?: string;
    index_image?: string;
    index_image_resolved?: string;
  };
  advisory?: {
    url?: string;
    internal_url?: string;
  };
  'github-release'?: {
    url?: string;
  };
  catalog_urls?: {
    name?: string;
    url?: string;
  }[];
  merge_requests?: {
    url?: string;
  }[];
  [key: string]: unknown;
};

export type ReleaseKind = K8sResourceCommon & {
  spec: {
    releasePlan: string;
    snapshot: string;
    data?: {
      releaseNotes?: {
        description?: string;
        references?: string[] | string;
        solution?: string;
        synopsis?: string;
        topic?: string;
      };
    };
  };
  status?: {
    artifacts?: ReleaseArtifacts;
    startTime?: string;
    completionTime?: string;
    automated?: boolean;
    collectorsProcessing?: {
      tenantCollectorsProcessing?: {
        completionTime?: string;
        pipelineRun?: string;
        startTime?: string;
        roleBinding?: string;
      };
    };
    tenantProcessing?: {
      completionTime?: string;
      pipelineRun?: string;
      startTime?: string;
      roleBinding?: string;
    };
    managedProcessing?: {
      completionTime?: string;
      pipelineRun?: string;
      startTime?: string;
      roleBinding?: string;
    };
    finalProcessing?: {
      completionTime?: string;
      pipelineRun?: string;
      startTime?: string;
      roleBinding?: string;
    };
    // keep this for backward compatibility
    processing?: {
      target?: string;
      pipelineRun?: string;
      releaseStrategy?: string;
    };
    conditions?: {
      type?: ReleaseCondition;
      reason?: string;
      status?: string;
      message?: string;
    }[];
  };
};

// Keep the release kind separated for adding more RAP related spec
// prodcut, product_version etc.
export type MonitoredReleaseKind = ReleaseKind & {
  product: string;
  product_version: string;
  rpa: string;
};
