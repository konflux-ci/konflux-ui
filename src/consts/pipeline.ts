export enum PipelineResourceType {
  git = 'git',
  image = 'image',
  cluster = 'cluster',
  storage = 'storage',
}

export enum VolumeTypes {
  NoWorkspace = 'noWorkspace',
  EmptyDirectory = 'emptyDirectory',
  ConfigMap = 'configMap',
  Secret = 'secret',
  PVC = 'pvc',
  VolumeClaimTemplate = 'volumeClaimTemplate',
}

export enum SecretAnnotationId {
  Git = 'git',
  Image = 'docker',
}

export const preferredNameAnnotation = 'pipeline.openshift.io/preferredName';

export const PIPELINE_SERVICE_ACCOUNT_PREFIX = 'build-pipeline-';

export const COMMON_SECRETS_LABEL = 'build.appstudio.openshift.io/common-secret';

export const PIPELINE_NAMESPACE = 'openshift-pipelines';

export const COMMIT_LABEL_KEYS = ['pipelinesascode.tekton.dev/sha', 'test-service.io/commit'];

export const COMMIT_ANNOTATION_KEYS = ['pipelinesascode.tekton.dev/sha'];
