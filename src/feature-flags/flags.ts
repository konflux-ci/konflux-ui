import { KonfluxInstanceEnvironmentType } from '~/types/konflux-public-info';

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
   * Optional environment constraints.
   * If specified, the flag is only available in the listed environments.
   * If not specified, the flag is available in all environments.
   */
  environments?: KonfluxInstanceEnvironmentType[];
}

const InternalFLAGS = {
  'dark-theme': {
    key: 'dark-theme',
    description: 'Enable the theme switcher in the header to toggle between light and dark modes.',
    defaultEnabled: false,
    status: 'wip',
  },
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
} satisfies Record<string, FeatureMeta>;

export type FlagKey = keyof typeof InternalFLAGS;

export const FLAGS = InternalFLAGS as unknown as Record<FlagKey, FeatureMeta>;
