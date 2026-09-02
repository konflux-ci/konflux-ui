import * as React from 'react';
import { useMatches } from 'react-router-dom';
import { getRoutePatternFromMatches } from '@routes/with-route-patterns';
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
 * Diffs feature-flag state between panel open and close (see
 * docs/analytics.md#feature-flag-change-tracking). Exported separately so
 * it's unit-testable without a component.
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
 * Tracks `feature_flags_changed` on panel close (see
 * docs/analytics.md#feature-flag-change-tracking). Takes `flags` from the
 * caller's `useFeatureFlags()` rather than reading `FeatureFlagsStore.state`
 * directly, so the diff always matches what React actually rendered.
 */
export const useFeatureFlagAnalytics = (flags: Record<FlagKey, boolean>): void => {
  const trackEvent = useTrackAnalyticsEvent();

  // trackEvent's identity changes every render; a ref keeps the effect below
  // tied to mount/unmount only.
  const trackEventRef = React.useRef(trackEvent);
  trackEventRef.current = trackEvent;

  // openFlagsRef/openPagePatternRef capture state at mount (open) only;
  // latestFlagsRef stays in sync so unmount always diffs fresh state.
  const openFlagsRef = React.useRef(flags);
  const latestFlagsRef = React.useRef(flags);
  latestFlagsRef.current = flags;

  const matches = useMatches();
  const openPagePatternRef = React.useRef(getRoutePatternFromMatches(matches));

  React.useEffect(() => {
    const openFlags = openFlagsRef.current;
    const pagePattern = openPagePatternRef.current;

    // React.StrictMode fakes a mount->unmount->mount in dev only; ignore
    // that fake unmount via a microtask -- a real close can't happen first.
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
        pagePattern,
      });
      logger.info('Feature flags panel closed', {
        event: TrackEvents.feature_flags_changed_event,
        changes,
        changesCount,
        pagePattern,
      });
    };
  }, []);
};
