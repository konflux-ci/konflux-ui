import { ResourceStatusCondition } from './common-types';
import { K8sResourceCommon } from './k8s';

export type ResourceRequirements = {
  requests?: {
    memory: string;
    cpu: string;
  };
  limits?: {
    memory: string;
    cpu: string;
  };
};

export type ComponentSource = {
  url?: string; // Will be required when we remove old component model
  /** @deprecated Will be removed when we remove old component model */
  git?: {
    url: string;
    devfileUrl?: string;
    dockerfileUrl?: string;
    revision?: string;
    context?: string;
  };

  dockerfileUri?: string;
  versions?: ComponentVersion[]; // Will be required when we remove old component model
};

export type RepositorySettings = {
  'comment-strategy'?: string;
  'github-app-token-scope-repos'?: string[];
};

export type ComponentActions = {
  'create-pipeline-configuration-pr'?: ComponentCreatePipelineConfiguration;
  'trigger-push-build'?: string;
  'trigger-push-builds'?: string[];
};

export type ComponentCreatePipelineConfiguration = {
  'all-versions'?: boolean;
  version?: string;
  versions?: string[];
};

export type ComponentVersion = {
  name: string;
  revision: string;
  context?: string;
  'skip-builds'?: boolean;
  'build-pipeline'?: ComponentBuildPipeline;
  dockerfileUri?: string;
};

export type PipelineDefinition = {
  'pipelineref-by-git-resolver'?: PipelineRefGit;
  'pipelineref-by-name'?: string;
  'pipelinespec-from-bundle'?: PipelineSpecFromBundle;
};

export type PipelineSpecFromBundle = {
  bundle: string;
  name: string;
};

export type PipelineRefGit = {
  pathInRepo: string;
  revision: string;
  url: string;
};

export type ComponentBuildPipeline = {
  'pull-and-push'?: PipelineDefinition;
  pull?: PipelineDefinition;
  push?: PipelineDefinition;
};

/** @deprecated Will be removed when we remove old component model */
export enum NudgeStats {
  NUDGES = 'build-nudges-ref',
  NUDGED_BY = 'build-nudged-by',
}

export type ComponentSpecs = {
  /** @deprecated Will be removed when we remove old component model */
  componentName: string;
  gitProviderAnnotation?: string;
  gitURLAnnotation?: string;
  /** @deprecated Will be removed when we remove old component model */
  application: string;
  /** @deprecated Will be removed when we remove old component model */
  secret?: string;
  source?: ComponentSource;
  containerImage?: string;
  resources?: ResourceRequirements;
  /** @deprecated Will be removed when we remove old component model */
  replicas?: number;
  releaseStrategies?: string[];
  /** @deprecated Will be removed when we remove old component model */
  targetPort?: number;
  /** @deprecated Will be removed when we remove old component model */
  route?: string;
  /** @deprecated Will be removed when we remove old component model */
  [NudgeStats.NUDGES]?: string[];
  env?: {
    name: string;
    value: string;
  }[];

  actions?: ComponentActions;
  'repository-settings'?: RepositorySettings;
  'skip-offboarding-pr'?: boolean;
  'default-build-pipeline'?: ComponentBuildPipeline;
};

export type ComponentVersionStatus = {
  'configuration-merge-url'?: string;
  message?: string;
  name?: string;
  'onboarding-status'?: string;
  'onboarding-time'?: string;
  revision?: string;
  'skip-builds'?: boolean;
};

export type ComponentStatus = {
  /** @deprecated Will be removed when we remove old component model */
  lastPromotedImage?: string;
  containerImage?: string;
  conditions?: ResourceStatusCondition[];
  /** @deprecated Will be removed when we remove old component model */
  devfile?: string;
  /** @deprecated Will be removed when we remove old component model */
  gitops?: { repositoryURL?: string; branch?: string; context?: string; commitID?: string };
  /** @deprecated Will be removed when we remove old component model */
  webhook?: string;
  /** @deprecated Will be removed when we remove old component model */
  [NudgeStats.NUDGED_BY]?: string[];

  'repository-settings'?: RepositorySettings;
  message?: string;
  'pac-repository'?: string;
  versions?: ComponentVersionStatus[]; // When version is removed from the spec, remove it from the status.
};

export type ComponentKind = K8sResourceCommon & {
  spec: ComponentSpecs;
  status?: ComponentStatus;
};
