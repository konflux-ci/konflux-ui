import { TourConfig, TourTrigger } from './types';

const toursByRoute = new Map<string, TourConfig[]>();

export const registerTour = (config: TourConfig): void => {
  const existing = toursByRoute.get(config.route) ?? [];
  existing.push(config);
  toursByRoute.set(config.route, existing);
};

export const getToursByRoute = (route: string, triggerFilter?: TourTrigger): TourConfig[] => {
  const tours = toursByRoute.get(route) ?? [];
  if (triggerFilter) {
    return tours.filter((t) => t.trigger === triggerFilter);
  }
  return tours;
};

/** For testing only */
export const clearRegistry = (): void => {
  toursByRoute.clear();
};
