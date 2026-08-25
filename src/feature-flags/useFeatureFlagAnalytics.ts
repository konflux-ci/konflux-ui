import * as React from 'react';
import { TrackEvents } from '~/analytics';
import { useTrackAnalyticsEvent } from '~/analytics/hooks';
import { logger } from '~/monitoring/logger';
import { FlagKey } from './flags';
import { FeatureFlagsStore } from './store';

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
 */
export const useFeatureFlagAnalytics = (): void => {
  const trackEvent = useTrackAnalyticsEvent();

  // trackEvent's identity changes on every render (useIsAnalyticsEnabled's
  // createConditionsHook always returns a new object). Reading it via a ref
  // keeps the effect below tied to mount/unmount only, not every re-render.
  const trackEventRef = React.useRef(trackEvent);
  trackEventRef.current = trackEvent;

  React.useEffect(() => {
    const openState = { ...FeatureFlagsStore.state };
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
        openState,
        FeatureFlagsStore.state,
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
