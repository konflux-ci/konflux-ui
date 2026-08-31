import * as React from 'react';
import { TrackEvents } from '~/analytics';
import { useTrackAnalyticsEvent } from '~/analytics/hooks';
import { logger } from '~/monitoring/logger';
import { FlagKey } from './flags';

/** Map of flag keys to their new boolean value. Only changed flags are included. */
export type FeatureFlagChanges = Partial<Record<FlagKey, boolean>>;

export interface FeatureFlagChangeDelta {
  changes: FeatureFlagChanges;
  changesCount: number;
}

/**
 * Diffs feature-flag state between panel open and close. Only flags whose
 * net value differs are included — a flag toggled off then back on nets to
 * unchanged. Exported separately so it's unit-testable without a component.
 */
export function computeFeatureFlagChanges(
  before: Record<FlagKey, boolean>,
  after: Record<FlagKey, boolean>,
): FeatureFlagChangeDelta {
  const changes: FeatureFlagChanges = {};
  let changesCount = 0;

  (Object.keys(after) as FlagKey[]).forEach((key) => {
    if (after[key] !== before[key]) {
      changes[key] = after[key];
      changesCount += 1;
    }
  });

  return { changes, changesCount };
}

/**
 * Tracks `feature_flags_changed` once per panel open/close (mount = open,
 * unmount = close), always firing even with no changes. Mirrors the
 * `useAuthAnalytics` pattern of a domain-colocated analytics hook.
 *
 * Takes `flags` from the caller's `useFeatureFlags()` rather than reading
 * `FeatureFlagsStore.state` directly, so the diff always matches what React
 * actually rendered instead of racing the store's imperative mutations.
 */
export const useFeatureFlagAnalytics = (flags: Record<FlagKey, boolean>): void => {
  const trackEvent = useTrackAnalyticsEvent();

  // trackEvent's identity changes on every render (useIsAnalyticsEnabled's
  // createConditionsHook always returns a new object). Reading it via a ref
  // keeps the effect below tied to mount/unmount only, not every re-render.
  const trackEventRef = React.useRef(trackEvent);
  trackEventRef.current = trackEvent;

  // openFlagsRef: set once, on the first render (mount = panel open).
  // latestFlagsRef: re-synced on every render, so the unmount cleanup below
  // always diffs against the latest rendered flags, never a stale closure.
  const openFlagsRef = React.useRef(flags);
  const latestFlagsRef = React.useRef(flags);
  latestFlagsRef.current = flags;

  React.useEffect(() => {
    const openFlags = openFlagsRef.current;
    const pagePath = window.location.pathname;

    // Dev-only: React.StrictMode (main.tsx) fakes an instant
    // mount->unmount->mount on every real mount to catch bugs -- this never
    // happens in production. Ignore that fake unmount: a real close can only
    // happen after this microtask resolves, once the panel has actually
    // rendered and the user has clicked something.
    let isConfirmedMount = false;
    void Promise.resolve().then(() => {
      isConfirmedMount = true;
    });

    return () => {
      if (!isConfirmedMount) {
        return;
      }

      const { changes, changesCount } = computeFeatureFlagChanges(
        openFlags,
        latestFlagsRef.current,
      );

      trackEventRef.current(TrackEvents.feature_flags_changed_event, {
        changes,
        changesCount,
        pagePath,
      });
      logger.info('Feature flags panel closed', {
        event: TrackEvents.feature_flags_changed_event,
        changes,
        changesCount,
        pagePath,
      });
    };
  }, []);
};
