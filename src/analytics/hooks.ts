import React from 'react';
import { analyticsService } from './AnalyticsService';
import { useIsAnalyticsEnabled } from './conditional-checks';
import type { EventPropertiesMap, TrackEvents } from './gen/analytics-types';

export const useTrackAnalyticsEvent = (): (<E extends TrackEvents>(
  event: E,
  properties: Omit<EventPropertiesMap[E], 'userId'>,
) => void) => {
  const { isAnalyticsEnabled } = useIsAnalyticsEnabled();

  return React.useCallback(
    <E extends TrackEvents>(event: E, properties: Omit<EventPropertiesMap[E], 'userId'>) => {
      if (isAnalyticsEnabled) {
        void analyticsService.track<E>(event, properties);
      }
    },
    [isAnalyticsEnabled],
  );
};
