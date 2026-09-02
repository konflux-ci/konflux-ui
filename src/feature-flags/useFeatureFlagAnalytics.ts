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

// Diffs flag state at open vs. close.
// See docs/analytics.md#feature-flag-change-tracking

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

// Module ref bridges Panel.tsx's static modal onClose to the mounted hook instance.
let activeCloseHandler: (() => void) | null = null;

/** Modal onClose callback */
export const trackFeatureFlagPanelClosed = (): void => {
  activeCloseHandler?.();
};

export const useFeatureFlagAnalytics = (flags: Record<FlagKey, boolean>): void => {
  const trackEvent = useTrackAnalyticsEvent();

  const trackEventRef = React.useRef(trackEvent);
  trackEventRef.current = trackEvent;

  const openFlagsRef = React.useRef(flags);
  const latestFlagsRef = React.useRef(flags);
  latestFlagsRef.current = flags;

  const matches = useMatches();
  const openPagePatternRef = React.useRef(getRoutePatternFromMatches(matches));

  React.useEffect(() => {
    const openFlags = openFlagsRef.current;
    const pagePattern = openPagePatternRef.current;
    let hasFired = false;

    activeCloseHandler = () => {
      if (hasFired) {
        return;
      }
      hasFired = true;

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

    return () => {
      activeCloseHandler = null;
    };
  }, []);
};
