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
  key: FlagKey;
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
}

type FeatureFlagDefinition = {
  key: string;
  description: string;
  defaultEnabled: boolean;
  status: 'wip' | 'enabled';
};

export const FLAGS: Record<string, FeatureFlagDefinition> = {
  'dark-theme': {
    key: 'dark-theme',
    description: 'Enable dark theme selector in the header',
    defaultEnabled: false,
    status: 'wip',
  },
};

export type FlagKey = keyof typeof FLAGS;
