import React from 'react';
import { useMatches } from 'react-router-dom';
import { analyticsService } from './AnalyticsService';
import { useIsAnalyticsEnabled } from './conditional-checks';
import { EventPropertiesMap, TrackEvents } from './gen/analytics-types';
import { journeyCollector } from './JourneyCollector';

export const useTrackAnalyticsEvent = (): (<E extends TrackEvents>(
  event: E,
  properties: EventPropertiesMap[E],
) => void) => {
  const { isAnalyticsEnabled } = useIsAnalyticsEnabled();

  return React.useCallback(
    <E extends TrackEvents>(event: E, properties: EventPropertiesMap[E]) => {
      if (isAnalyticsEnabled) {
        void analyticsService.track<E>(event, properties);
      }
    },
    [isAnalyticsEnabled],
  );
};

/** Records the privacy-safe route pattern supplied by the active route. */
export const useJourneyTracker = (): void => {
  const matches = useMatches();
  const { isAnalyticsEnabled } = useIsAnalyticsEnabled();
  const pattern = (
    matches[matches.length - 1]?.handle as { routePattern?: string } | undefined
  )?.routePattern ?? '/unknown';

  React.useEffect(() => {
    if (isAnalyticsEnabled) {
      journeyCollector.recordStep(pattern);
    }
  }, [pattern, isAnalyticsEnabled]);
};
