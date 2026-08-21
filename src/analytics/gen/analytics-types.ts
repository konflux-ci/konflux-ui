/**
 * ⚠️  AUTO-GENERATED FILE — DO NOT EDIT MANUALLY ⚠️
 *
 * This file was generated from the Konflux analytics schema.
 * Schema: https://github.com/konflux-ci/segment-bridge/blob/0099a60b14b3e7e3860a4bb9e292d340b669f62e/schema/ui.json
 * Docs:   docs/analytics.md
 *
 * To regenerate, run: yarn generate:analytics-types
 *
 * LLM INSTRUCTIONS: If asked to modify analytics types, always regenerate
 * from schema instead of editing this file directly.
 */
/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-duplicate-type-constituents */

/**
 * Union of all Konflux UI analytics event types
 */
export type KonfluxUISegmentEvents =
  | UserLoginEvent
  | UserLogoutEvent
  | FeedbackSubmittedEvent
  | UiSessionStartedEvent
  | FeatureFlagsChangedEvent
  | UserJourneyEvent;
/**
 * Fired when a user successfully authenticates into Konflux
 */
export type UserLoginEvent = CommonFields & {};
/**
 * Fired when a user session ends, either by explicit logout or session expiry
 */
export type UserLogoutEvent = CommonFields & {};
/**
 * Fired when a user submits feedback through the Konflux UI
 */
export type FeedbackSubmittedEvent = CommonFields & {
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
 * Fired once per browser tab on the first app load, regardless of auth state, to capture how the user arrived at Konflux UI
 */
export type UiSessionStartedEvent = CommonFields & {
  /**
   * Classification of document.referrer on first load, e.g. 'github' if the referrer host is github.com (or a subdomain).
   */
  arrivalSource: string;
};
/**
 * Fired every time the Feature Flag Panel modal is closed. Contains only the flags whose effective state changed between panel open and panel close. changesCount may be 0 when user opened the panel but did not change anything (tracks panel awareness).
 */
export type FeatureFlagsChangedEvent = CommonFields & {
  /**
   * Map of changed flag keys to their new boolean value. Empty object if no flags were changed.
   */
  changes: {
    [k: string]: boolean;
  };
  /**
   * Number of flags that changed. 0 means the user opened the panel but did not change anything.
   */
  changesCount: number;
  /**
   * Route pattern when the panel was opened (e.g. /ns/:workspaceName/applications), never the resolved URL
   */
  pagePattern: string;
};
/**
 * Fired once per session, or once per part when the payload is auto-split, capturing the navigation path and per-page dwell times
 */
export type UserJourneyEvent = CommonFields & {
  /**
   * ISO-8601 timestamp of when the session started
   */
  sessionStartedAt: string;
  /**
   * Duration of this journey part in milliseconds. For auto-split journeys, each part reports the duration of its own session segment rather than the full journey.
   */
  totalDurationMs: number;
  /**
   * Ordered list of steps (page visits) taken during the session
   *
   * @minItems 1
   */
  steps: [JourneyStep, ...JourneyStep[]];
  /**
   * Stable identifier linking all parts of a split journey. Only present when auto-split fires (payload exceeded size threshold).
   */
  journeyId?: string;
  /**
   * Zero-based index of this part within a split journey. Only present when auto-split fires.
   */
  journeyPartIndex?: number;
};

/**
 * Base fields required on every Segment event sent from Konflux UI
 */
export interface CommonFields {
  /**
   * Random UUID generated in memory for the current browser tab; regenerated for each tab
   */
  sessionId: string;
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
/**
 * A single step (page visit) within a user's navigation journey
 */
export interface JourneyStep {
  /**
   * Route pattern of the page, e.g. /ns/:workspaceName/applications. Must be the route pattern, not the resolved URL — never include workspace/tenant names or other identifiers from the actual path.
   */
  pagePattern: string;
  /**
   * Time in milliseconds the user spent on this step
   */
  durationMs: number;
  /**
   * Route pattern the user navigated to after leaving this step. Absent on the last (still-open) step. Must be the route pattern, not the resolved URL.
   */
  toPagePattern?: string;
  /**
   * Total milliseconds the browser tab was hidden (backgrounded) while the user was on this step. Allows computing active dwell time as durationMs - hiddenMs. Only present when greater than 0.
   */
  hiddenMs?: number;
}

/**
 * Event names for Segment track() calls.
 * Values match the x-event-name field in the schema.
 */
export enum TrackEvents {
  user_login_event = 'user_login',
  user_logout_event = 'user_logout',
  user_journey_event = 'user_journey',
  feedback_submitted_event = 'feedback_submitted',
  ui_session_started_event = 'ui_session_started',
  feature_flags_changed_event = 'feature_flags_changed',
}

/**
 * Maps each TrackEvents value to the event-specific properties callers must supply.
 * CommonFields are excluded — they are merged automatically from commonProperties.
 */
export type EventPropertiesMap = {
  [TrackEvents.user_login_event]: Record<string, never>;
  [TrackEvents.user_logout_event]: Record<string, never>;
  [TrackEvents.user_journey_event]: Omit<UserJourneyEvent, keyof CommonFields>;
  [TrackEvents.feedback_submitted_event]: Omit<FeedbackSubmittedEvent, keyof CommonFields>;
  [TrackEvents.ui_session_started_event]: Omit<UiSessionStartedEvent, keyof CommonFields>;
  [TrackEvents.feature_flags_changed_event]: Omit<FeatureFlagsChangedEvent, keyof CommonFields>;
};
