import { useEffect, useRef } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { collectAndMerge } from '../merge-utils';
import { getRegisteredRoutes, getToursByRoute } from '../registry';
import { useTourContext } from '../TourProvider';
import { useTour } from './useTour';

/**
 * Resolves the current URL pathname to a registered tour route pattern
 * using React Router's matchPath. Returns the matching route key or undefined.
 */
const resolveCurrentRoute = (pathname: string): string | undefined => {
  const routes = getRegisteredRoutes();
  return routes.find((route) => matchPath({ path: `/${route}`, end: true }, pathname));
};

/**
 * Auto-triggers tours on first page visit. Mounted at the app root.
 * Uses URL-to-pattern matching to determine which tours apply to the current page.
 */
export const useTourAutoTrigger = (): void => {
  const location = useLocation();
  const { setCurrentRoute } = useTourContext();
  const { isActive, startTour, seen } = useTour();
  const triggeredRef = useRef<string | null>(null);

  const currentRoute = resolveCurrentRoute(location.pathname);

  // Keep context in sync so HelpDropdown can read it
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
