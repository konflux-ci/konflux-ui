import { GuardSpec } from './conditions';

export const FLAGS_STATUS = {
  wip: 'Unstable',
  ready: 'Stable',
} as const;

/**
 * Feature flags for the application.
 * wip - work in progress
 * ready - feature is stable and ready for production
 */
export type FlagStatus = keyof typeof FLAGS_STATUS;

export interface FeatureMeta {
  /**
   * Unique key for the feature flag.
   * This key is used to identify the feature flag in the codebase.
   */
  key: string;
  /**
   * Description of the feature flag.
   * This description is used to provide context for the feature flag.
   */
  description: string;
  /**
   * Default enabled state of the feature flag.
   * This state is used to determine if the feature flag is enabled by default.
   */
  defaultEnabled: boolean;
  /**
   * Status of the feature flag.
   * This status is used to determine if the feature flag is a work in progress or ready for production.
   */
  status: FlagStatus;
  /**
   * Optional validator function for conditional flags.
   * If specified, the flag can only be enabled when the validator returns true.
   * The validator is called before allowing the user to enable the flag.
   */
  guard?: GuardSpec;
}

const KA = 'KubeArchive n/a';

const InternalFLAGS = {
  'column-management': {
    key: 'column-management',
    description: 'Manage columns',
    defaultEnabled: true,
    status: 'ready',
  },
  'system-notifications': {
    key: 'system-notifications',
    description: 'System notifications',
    defaultEnabled: false,
    status: 'wip',
    guard: {
      allOf: ['isSystemNotificationsAccessible'],
      failureReason: 'No access',
    },
  },
  'kubearchive-logs': {
    key: 'kubearchive-logs',
    description: 'KubeArchive logs',
    defaultEnabled: true,
    status: 'ready',
    guard: {
      allOf: ['isKubearchiveEnabled'],
      failureReason: KA,
    },
  },
  'conforma-policy': {
    key: 'conforma-policy',
    description: 'Conforma Results',
    defaultEnabled: false,
    status: 'wip',
    guard: {
      failureReason: 'Conforma WIP',
    },
  },
  'taskruns-kubearchive': {
    key: 'taskruns-kubearchive',
    description: 'KubeArchive TaskRuns',
    defaultEnabled: true,
    status: 'ready',
    guard: {
      allOf: ['isKubearchiveEnabled'],
      failureReason: KA,
    },
  },
  'pipelineruns-kubearchive': {
    key: 'pipelineruns-kubearchive',
    description: 'KubeArchive PipelineRuns',
    defaultEnabled: true,
    status: 'ready',
    guard: {
      allOf: ['isKubearchiveEnabled'],
      failureReason: KA,
    },
  },
  'component-model': {
    key: 'component-model',
    description: 'New component model',
    defaultEnabled: false,
    status: 'wip',
    guard: {
      allOf: ['isStagingCluster'],
      failureReason: 'Not staging',
      visibleInFeatureFlagPanel: false,
    },
  },
  'feedback-section': {
    key: 'feedback-section',
    description: 'Send feedback',
    defaultEnabled: true,
    status: 'wip',
    guard: {
      allOf: ['isAnalyticsEnabled'],
      failureReason: 'Analytics off',
    },
  },
  'edit-secret-page': {
    key: 'edit-secret-page',
    description: 'Edit secrets',
    defaultEnabled: true,
    status: 'wip',
  },
  'ai-chat': {
    key: 'ai-chat',
    description: 'AI chat',
    defaultEnabled: false,
    status: 'wip',
    guard: {
      allOf: ['isStagingCluster', 'isLightspeedAvailable'],
      failureReason: 'Needs staging+AI',
      visibleInFeatureFlagPanel: false,
    },
  },
  'pipeline-runs-page': {
    key: 'pipeline-runs-page',
    description: 'Pipeline Runs page',
    defaultEnabled: true,
    status: 'wip',
  },
  mintmaker: {
    key: 'mintmaker',
    description: 'MintMaker',
    defaultEnabled: true,
    status: 'wip',
  },
} satisfies Record<string, FeatureMeta>;

export type FlagKey = keyof typeof InternalFLAGS;

export const FLAGS = InternalFLAGS as unknown as Record<FlagKey, FeatureMeta>;
