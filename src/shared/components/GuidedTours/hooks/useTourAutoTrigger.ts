import { useEffect, useRef } from 'react';
import { collectAndMerge } from '../merge-utils';
import { getToursByRoute } from '../registry';
import { useTourContext } from '../TourProvider';
import { useTour } from './useTour';

/**
 * Auto-triggers tours on first page visit.
 *
 * @param currentRoute - the route pattern (e.g., 'ns/:workspaceName/applications')
 */
export const useTourAutoTrigger = (currentRoute: string | undefined): void => {
  const { setCurrentRoute } = useTourContext();
  const { isActive, startTour, seen } = useTour();
  const triggeredRef = useRef<string | null>(null);

  // Always update current route in context so HelpDropdown can read it
  useEffect(() => {
    setCurrentRoute(currentRoute);
  }, [currentRoute, setCurrentRoute]);

  useEffect(() => {
    if (isActive || !currentRoute) return;
    if (triggeredRef.current === currentRoute) return;

    const entries = getToursByRoute(currentRoute, 'auto');
    if (entries.length === 0) return;

    const result = collectAndMerge(entries, seen);
    if (result.mergedSteps.length === 0) return;

    // TODO: if result.hasPrompt, show PromptPopover instead of auto-starting
    // PromptPopover is a planned feature (see design spec)
    triggeredRef.current = currentRoute;
    startTour(result.mergedSteps, result.sourceIds);
  }, [isActive, currentRoute, seen, startTour]);
};
