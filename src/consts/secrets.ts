export const FIELD_SECRET_FOR_COMPONENT_OPTION = 'secretForComponentOption';
export const IMAGE_PULL_SECRET_TYPES = [
  'kubernetes.io/dockerconfigjson',
  'kubernetes.io/dockercfg',
] as const;
export const LINKING_ERROR_ANNOTATION = 'konflux-ui/linking-secret-action-error';
export const MAX_ANNOTATION_LENGTH = 2048;
export const LINKING_STATUS_ANNOTATION = 'konflux-ui/linking-secret-action-status';
export const SecretLinkOptionLabels = {
  default: {
    none: 'Do not link',
    all: 'All existing and future components in the namespace',
    partial: 'Select components in the namespace',
  },
  forImportSecret: {
    all: 'Current component, all existing and future components in the namespace',
    partial: 'Select components in the namespace',
  },
} as const;
export const IMPORT_SECRET_HELP_TEXT =
  'Keep your data secure by defining a build time secret. Secrets are stored at a namespace level so applications within namespace will have access to these secrets.';
export const SECRET_MAX_LABELS = 3;
export const SECRET_LINK_OPTION_HELP_TEXT =
  'Select an option to link this secret with your desired components in the namespace.';
