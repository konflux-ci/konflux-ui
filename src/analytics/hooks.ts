import React from 'react';
import { analyticsService } from './AnalyticsService';
import { useIsAnalyticsEnabled } from './conditional-checks';
import { CommonFields, EventPropertiesMap, TrackEvents } from './gen/analytics-types';

/**
 * Sets CommonFields on the analytics service so every track() call includes them.
 *
 * Call this once near the root of the authenticated component tree,
 * passing version data fetched from your cluster info source.
 *
 * @example
 * ```tsx
 * const App = () => {
 *   useAnalyticsCommonProperties({
 *     clusterVersion: info.clusterVersion,
 *     konfluxVersion: info.konfluxVersion,
 *     kubernetesVersion: info.kubernetesVersion,
 *   });
 *   return <Routes />;
 * };
 * ```
 */
export const useAnalyticsCommonProperties = (properties: Partial<CommonFields>) => {
  const serialized = JSON.stringify(properties);
  React.useEffect(() => {
    const parsed: Partial<CommonFields> = JSON.parse(serialized);
    const hasValues = Object.values(parsed).some(Boolean);
    if (hasValues) {
      analyticsService.setCommonProperties(parsed);
    }
  }, [serialized]);
};

export const useTrackAnalyticsEvent = (): (<E extends TrackEvents>(
  event: E,
  properties: EventPropertiesMap[E],
) => void) => {
  const isAnalyticsEnabled = useIsAnalyticsEnabled();

  return React.useCallback(
    <E extends TrackEvents>(event: E, properties: EventPropertiesMap[E]) => {
      if (isAnalyticsEnabled) {
        void analyticsService.track<E>(event, properties);
      }
    },
    [isAnalyticsEnabled],
  );
};
