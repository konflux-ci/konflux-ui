export const FIELD_SECRET_FOR_COMPONENT_OPTION = 'secretForComponentOption';
export const IMAGE_PULL_SECRET_TYPES = [
  'kubernetes.io/dockerconfigjson',
  'kubernetes.io/dockercfg',
] as const;
export const LINKING_ERROR_ANNOTATION = 'konflux-ui/linking-secret-action-error';
export const MAX_ANNOTATION_LENGTH = 2048;
export const LINKING_STATUS_ANNOTATION = 'konflux-ui/linking-secret-action-status';
