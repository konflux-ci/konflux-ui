import { useEffect, useRef } from 'react';
import { collectAndMerge } from '../merge-utils';
import { getToursByRoute } from '../registry';
import { useTour } from './useTour';

/**
 * Auto-triggers tours on first page visit.
 *
 * @param currentRoute - the route pattern (e.g., 'ns/:workspaceName/applications')
 */
export const useTourAutoTrigger = (currentRoute: string | undefined): void => {
  const { isActive, startTour, seen } = useTour();
  const triggeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (isActive || !currentRoute) return;
    if (triggeredRef.current === currentRoute) return;

    const entries = getToursByRoute(currentRoute, 'auto');
    if (entries.length === 0) return;

    const result = collectAndMerge(entries, seen);
    if (result.mergedSteps.length === 0) return;

    triggeredRef.current = currentRoute;
    startTour(result.mergedSteps, result.sourceIds);
  }, [isActive, currentRoute, seen, startTour]);
};
