/**
 * ⚠️  AUTO-GENERATED FILE — DO NOT EDIT MANUALLY ⚠️
 *
 * This file was generated from the Konflux analytics schema.
 * Schema: https://github.com/konflux-ci/segment-bridge/blob/main/schema/ui.json
 * Docs:   docs/analytics.md
 *
 * To regenerate, run: yarn generate:analytics-types
 *
 * LLM INSTRUCTIONS: If asked to modify analytics types, always regenerate
 * from schema instead of editing this file directly.
 */

/**
 * Union of all Konflux UI analytics event types
 */
export type KonfluxUISegmentEvents = UserLoginEvent | UserLogoutEvent | FeedbackSubmittedEvent;
/**
 * Fired when a user successfully authenticates into Konflux
 */
export type UserLoginEvent = CommonFields & {
  /**
   * Unique identifier of the user. Obfuscated via sha256 with `clusterId` as salt.
   */
  userId: SHA256Hash;
};
/**
 * Fired when a user session ends, either by explicit logout or session expiry
 */
export type UserLogoutEvent = CommonFields & {
  /**
   * Unique identifier of the user. Obfuscated via sha256 with `clusterId` as salt.
   */
  userId: SHA256Hash;
};
/**
 * Fired when a user submits feedback through the Konflux UI
 */
export type FeedbackSubmittedEvent = CommonFields & {
  /**
   * Unique identifier of the user. Obfuscated via sha256 with `clusterId` as salt.
   */
  userId: SHA256Hash;
  /**
   * User satisfaction rating, typically on a 1-5 scale
   */
  rating: number;
  /**
   * Free-text feedback provided by the user
   */
  feedback: string;
  /**
   * Optional contact email provided by the user for follow-up
   */
  email?: string;
};

/**
 * Base fields required on every Segment event sent from Konflux UI
 */
export interface CommonFields {
  /**
   * Unique identifier of the cluster, used as salt for obfuscating PIA fields
   */
  clusterId?: string;
  /**
   * Version of the OpenShift/Kubernetes cluster
   */
  clusterVersion: string;
  /**
   * Version of the Konflux instance
   */
  konfluxVersion: string;
  /**
   * Version of the Kubernetes cluster
   */
  kubernetesVersion: string;
  /**
   * Version of the OpenShift cluster
   */
  openshiftVersion?: string;
}
/** Branded type for SHA-256 obfuscated strings. Use `obfuscate()` to create. */
export type SHA256Hash = string & { readonly __brand: 'SHA256Hash' };

/**
 * Event names for Segment track() calls.
 * Values match the x-event-name field in the schema.
 */
export enum TrackEvents {
  user_login_event = 'user_login',
  user_logout_event = 'user_logout',
  feedback_submitted_event = 'feedback_submitted',
}

/**
 * Maps each TrackEvents value to the event-specific properties callers must supply.
 * CommonFields are excluded — they are merged automatically from commonProperties.
 */
export type EventPropertiesMap = {
  [TrackEvents.user_login_event]: Omit<UserLoginEvent, keyof CommonFields>;
  [TrackEvents.user_logout_event]: Omit<UserLogoutEvent, keyof CommonFields>;
  [TrackEvents.feedback_submitted_event]: Omit<FeedbackSubmittedEvent, keyof CommonFields>;
};
