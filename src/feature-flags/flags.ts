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

const InternalFLAGS = {
  'release-monitor': {
    key: 'release-monitor',
    description:
      'New release monitor page that make user see all the related releases of viable namespaces',
    defaultEnabled: false,
    status: 'wip',
  },
  'column-management': {
    key: 'column-management',
    description: 'Enable the "Manage columns" button for tables with more than six columns',
    defaultEnabled: true,
    status: 'ready',
  },
  'system-notifications': {
    key: 'system-notifications',
    description: 'Enable system notifications badge and notification center',
    defaultEnabled: false,
    status: 'wip',
  },
  'kubearchive-logs': {
    key: 'kubearchive-logs',
    description: 'Use Kubearchive to fetch logs instead of Tekton',
    defaultEnabled: false,
    status: 'wip',
    guard: {
      allOf: ['isKubearchiveEnabled'],
      failureReason: 'Kubearchive is not installed on this cluster',
      visibleInFeatureFlagPanel: true,
    },
  },
} satisfies Record<string, FeatureMeta>;

export type FlagKey = keyof typeof InternalFLAGS;

export const FLAGS = InternalFLAGS as unknown as Record<FlagKey, FeatureMeta>;
