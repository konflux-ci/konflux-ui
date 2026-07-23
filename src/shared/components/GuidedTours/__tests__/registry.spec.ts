import { registerTour, getToursByRoute, getRegisteredRoutes, clearRegistry } from '../registry';
import { TourConfig } from '../types';

const makeTour = (overrides: Partial<TourConfig> = {}): TourConfig => ({
  id: 'test-tour',
  route: 'ns/:workspaceName/applications',
  trigger: 'auto',
  steps: [{ type: 'modal', title: 'Welcome', content: 'Hello' }],
  ...overrides,
});

describe('tour registry', () => {
  afterEach(() => clearRegistry());

  it('registers and retrieves tours by route', () => {
    const tour = makeTour();
    registerTour(tour);
    const result = getToursByRoute('ns/:workspaceName/applications');
    expect(result).toEqual([tour]);
  });

  it('returns empty array for unregistered routes', () => {
    expect(getToursByRoute('ns/:workspaceName/secrets')).toEqual([]);
  });

  it('returns all tours for a given route', () => {
    const tourA = makeTour({ id: 'tour-a' });
    const tourB = makeTour({ id: 'tour-b' });
    registerTour(tourA);
    registerTour(tourB);
    const result = getToursByRoute('ns/:workspaceName/applications');
    expect(result).toHaveLength(2);
  });

  it('does not return tours from different routes', () => {
    registerTour(makeTour({ id: 'a', route: 'ns/:workspaceName/applications' }));
    registerTour(makeTour({ id: 'b', route: 'ns/:workspaceName/secrets' }));
    expect(getToursByRoute('ns/:workspaceName/applications')).toHaveLength(1);
    expect(getToursByRoute('ns/:workspaceName/secrets')).toHaveLength(1);
  });

  it('getRegisteredRoutes returns all registered route patterns', () => {
    registerTour(makeTour({ id: 'a', route: 'ns/:workspaceName/applications' }));
    registerTour(makeTour({ id: 'b', route: 'ns/:workspaceName/secrets' }));
    const routes = getRegisteredRoutes();
    expect(routes).toHaveLength(2);
    expect(routes).toContain('ns/:workspaceName/applications');
    expect(routes).toContain('ns/:workspaceName/secrets');
  });

  it('filters by trigger type when specified', () => {
    registerTour(makeTour({ id: 'auto', trigger: 'auto' }));
    registerTour(makeTour({ id: 'manual', trigger: 'manual' }));
    expect(getToursByRoute('ns/:workspaceName/applications', 'auto')).toHaveLength(1);
    expect(getToursByRoute('ns/:workspaceName/applications', 'manual')).toHaveLength(1);
    expect(getToursByRoute('ns/:workspaceName/applications')).toHaveLength(2);
  });
});
